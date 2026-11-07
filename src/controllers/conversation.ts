import { Request, Response } from "express";
import { createGroupConversationSchema, getConversationsQuerySchema, getMessagesQuerySchema, sendMessageSchema } from "../schemas/conversation.js";
import { uploadFile } from "../config/imagekit.js";
import pool from "../config/db.js";
import { v4 as uuidv4, validate as isUuid  } from "uuid";
import crypto from "crypto";
import { success } from "zod";

// @route POST /api/conversations/messages
// @desc start a new conversation
// @access Authenticated users only
export const createMessage = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const payload = {...req.body};

  const validation = sendMessageSchema.safeParse(payload)
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid Request",
      errors: validation.error.flatten().fieldErrors  
    })
  }

  const { conversation_id, recipent_id, content } = validation.data;
  const files = (req.files as Express.Multer.File[]) ?? [];

  if (!content && files.length === 0) {
    return res.status(400).json({ success: false, message: "Message must contain text or attachments"})
  }

  const attachments = await Promise.all(
    files.map(async (file) => {
      const url = await uploadFile(file.buffer, file.originalname, file.mimetype);
      return { url, file_name: file.originalname, file_size: file.size, mimetype: file.mimetype}
    })
  )

  const client = await pool.connect();

  try {
    await client.query('BEGIN')

    let targetConversationId = conversation_id;

    // LAZY CREATION
    if (!targetConversationId) {
      if (recipent_id === userId) {
        return res.status(400).json({ success: false, message: "You cannot message yourself" })
      }

      const findConvQuery = `
        SELECT c.id
        FROM conversations c
        JOIN conversation_members cm1 ON c.id = cm1.conversation_id
        JOIN conversation_members cm2 ON c.id = cm2.conversation_id
        WHERE c.type = 'direct'
          AND cm1.user_id = $1
          AND cm2.user_id = $2
        LIMIT 1
      `;

      const existingConv = await client.query(findConvQuery, [userId, recipent_id]);

      if (existingConv.rows.length > 0) {
        targetConversationId = existingConv.rows[0].id;
      } else {
        targetConversationId = uuidv4()

        await client.query(`
          INSERT INTO conversations (id, type, last_message_at) VALUES ($1, 'direct', NOW())
        `, [targetConversationId])

        await client.query(`
          INSERT INTO conversation_members (conversation_id, user_id, role)
          VALUES ($1, $2, 'owner'), ($1, $3, 'member')
        `, [targetConversationId, userId, recipent_id])
        console.log("created new conv members......")
      }
    }

    // EXISTING CONVERSATION BRANCH
    if (conversation_id) {
      const membershipCheck = await client.query(`
        SELECT 
          role 
        FROM conversation_members 
        WHERE conversation_id = $1 AND user_id = $2 AND status = 'active'
      `, [conversation_id, userId])

      if (membershipCheck.rows.length === 0) {
        await client.query('ROLLBACK')
        return res.status(403).json({ success: false, message: "Not a member of this conversation" })
      }
    }

    // INSERT MESSAGE
    const messageId = uuidv4();
    const insertMessageQuery = `
      INSERT INTO messages (id, conversation_id, sender_id, content, attachments)
      VALUES ($1, $2, $3, $4, $5::jsonb)
      RETURNING id, conversation_id, sender_id, content, created_at
    `;
    const { rows } = await client.query(insertMessageQuery, [
      messageId,
      conversation_id,
      userId,
      content || null,
      JSON.stringify(attachments)
    ]);

    // UPDATE read stamps
    await client.query(`
      UPDATE conversations SET last_message_at = NOW(), updated_at = NOW() WHERE id = $1
    `, [conversation_id])

    await client.query(`
      UPDATE conversation_members SET last_read_at = NOW() WHERE conversation_id = $1 AND user_id = $2
    `, [conversation_id, userId])

    await client.query('COMMIT')

    return res.status(201).json({
      success: true,
      data: {
        ...rows[0],
        conversation_id: targetConversationId
      }
    })
  } catch (error) {
    await client.query('ROLLBACK')
    return res.status(500).json({ success: false, message: "Failed to send message" })
  } finally {
    client.release()
  }
}

// @route POST /api/conversations
// @desc create a new group or project conversation
// @access Authenticated users only
export const createConversation = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const payload = {...req.body};

  const validation = createGroupConversationSchema.safeParse(payload)
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid Request",
      errors: validation.error.flatten().fieldErrors
    })
  }

  const { type, name, join_policy } = validation.data;

  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  const iconFile = files?.["icon"]?.[0];

  const client = await pool.connect();

  try {
    let iconUrl: string | null = null;
    if (iconFile) {
      iconUrl = await uploadFile(iconFile.buffer, iconFile.originalname, iconFile.mimetype)
    }

    await client.query('BEGIN')

    const conversationId = uuidv4();
    const inviteCode = crypto.randomBytes(8).toString("hex")
    
    const { rows } = await client.query(`
      INSERT INTO conversations (id, type, name, icon_url, join_policy, invite_link)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, type, name, icon_url, created_at, last_message_at
    `, [conversationId, type, name, iconUrl || null, join_policy, inviteCode])

    await client.query(`
      INSERT INTO conversation_members (conversation_id, user_id, role)
      VALUES ($1, $2, $3)
    `, [conversationId, userId, 'owner'])

    await client.query('COMMIT')

    return res.status(201).json({ 
      success: true,
      message: `${type === "group" ? "Group" : "Project"} conversation created`,
      data: {
        ...rows[0],
        invite_link: `/messages/join/${inviteCode}`
      }
    })
  } catch (error) {
    await client.query('ROLLBACK')
    return res.status(500).json({ success: false, message: "Failed to create conversation" })
  } finally {
    client.release()
  }
}

// @route GET /api/conversations
// @desc get all conversations for the authenticated user
// @access Members only
export const getConversations = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  const validation = getConversationsQuerySchema.safeParse(req.query);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid Request",
      errors: validation.error.flatten().fieldErrors
    })
  }

  const { type } = validation.data;

  try {
    const query = `
      SELECT
        c.id,
        c.type,
        c.last_message_at,
        c.created_at,
        cm.last_read_at,
        (
          SELECT COUNT(*)::INTEGER
          FROM messages m
          WHERE m.conversation_id = c.id
            AND m.created_at > cm.last_read_at
            AND m.sender_id != $1
        ) AS unread_count,
        CASE
          WHEN c.type = 'direct' THEN (
            SELECT json_build_object (
              'id', prof.user_id,
              'name', prof.full_name,
              'avatar_url', prof.avatar_url
            )
            FROM conversation_members cm_partner
            JOIN profiles prof ON cm_partner.user_id = prof.user_id
            WHERE cm_partner.conversation_id = c.id AND cm_partner.user_id != $1
            LIMIT 1
          )
          ELSE NULL
        END AS partner,
        (
          SELECT json_build_object (
            'id', m.id,
            'content', m.content,
            'has_attachments', (jsonb_array_length(m.attachments) > 0),
            'sender_id', m.sender_id,
            'sender_name', prof.full_name,
            'created_at', m.created_at
          ) 
          FROM messages m
          JOIN profiles prof ON prof.user_id = m.sender_id
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) AS last_message
      FROM conversation_members cm
      JOIN conversations c ON cm.conversation_id = c.id
      WHERE cm.user_id = $1
        AND ($2::VARCHAR IS NULL OR c.type = $2)
      ORDER BY c.last_message_at DESC;
    `;

    const { rows } = await pool.query(query, [userId, type || null]);

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch conversations" })
  }
}

// @route GET /api/conversations/:id/messages
// @desc get all messages for a specific convo
// @access Members only
export const getMessages = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const convoId = req.params.id;

  if (!convoId || !isUuid(convoId)) {
    return res.status(400).json({ success: false, message: "Conversation Id is required" })
  }

  const validation = getMessagesQuerySchema.safeParse(req.query);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid Request",
      errors: validation.error.flatten().fieldErrors
    })
  }

  const { limit, cursor } = validation.data;

  try {
    const membershipCheck = await pool.query(`
      SELECT 
        role 
      FROM conversation_members 
      WHERE conversation_id = $1 AND user_id = $2 AND status = 'active'
    `, [convoId, userId])

    if (membershipCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Conversation Not Found" })
    }

    const query = `
      SELECT
        m.id,
        m.conversation_id,
        m.sender_id,
        prof.full_name AS sender_name,
        prof.avatar_url AS sender_avatar_url,
        m.content,
        m.attachments,
        m.created_at,
        m.updated_at
      FROM messages m
      JOIN profiles prof ON m.sender_id = prof.user_id
      WHERE m.conversation_id = $1
        AND ($2::TIMESTAMPTZ IS NULL OR m.created_at < $2)
      ORDER BY m.created_at DESC
      LIMIT $3
    `;

    const { rows } = await pool.query(query, [convoId, cursor || null, limit]);

    const messages = rows.reverse();
    const nextCursor = rows.length === limit ? rows[0].created_at : null;

    await pool.query(`
      UPDATE conversation_members
      SET last_read_at = NOW()
      WHERE conversation_id = $1 AND user_id = $2  
    `, [convoId, userId])

    return res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        next_cursor: nextCursor,
        has_more: rows.length === limit
      }
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch messages"})
  }
}

// @route PATCH /api/conversations/:id/read
// @desc mark a conversation as read
// @access Members only
export const markConversationsAsRead = async (req: Request, res: Response) => {
  const convoId = req.params.id;
  const userId = req.user?.id;

  if (!convoId || !isUuid(convoId)) {
    return res.status(400).json({ success: false, message: "Conversation Id is required" })
  }

  try {
    const query = `
      UPDATE conversation_members
      SET last_read_at = NOW()
      WHERE conversation_id = $1 AND user_id = $2 AND status = 'active'
      RETURNING conversation_id, user_id, last_read_at
    `;

    const { rows, rowCount } = await pool.query(query, [convoId, userId]);

    if (rowCount === 0) {
      return res.status(403).json({ success: false, message: "You are not a member of this conversation" })
    }

    return res.status(200).json({
      success: true,
      message: "Conversation marked as read",
      data: rows[0]
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to mark conversation as read" })
  }
}

// @route POST /api/conversations/join/:code
// @desc join a conversation by code
// @access Authenticated users
export const joinConversation = async (req: Request, res: Response) => {
  const code = req.params.code;
  const userId = req.user?.id;

  if (!code) {
    return res.status(400).json({ success: false, message: "Invite code is required" })
  }

  try {
    const convResult = await pool.query(`
      SELECT id, name join_policy FROM conversations WHERE invite_link = $1
    `, [code])

    if (convResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Invalid or Expired Invite Code" })
    }

    const conv = convResult.rows[0];

    const existingMember = await pool.query(`
      SELECT status FROM conversation_members WHERE conversation_id = $1 AND user_id = $2
    `, [conv.id, userId])

    if (existingMember.rows.length > 0) {
      const { status } = existingMember.rows[0];

      if (status === "active") {
        return res.status(200).json({ 
          success: true, 
          status: "active", 
          message: "Already a member", 
          conversation_id: conv.id 
        })
      }

      if (status === "pending") {
        return res.status(409).json({ success: false, message: "Your request is pending approval "})
      }
    }

    const initialStatus = conv.join_policy === "approval_required" ? "pending" : "active";

    await pool.query(`
      INSERT INTO conversation_members 
        (conversation_id, user_id, role, status, last_read_at)
      VALUES ($1, $2, 'member', $3, NOW())
      ON CONFLICT (conversation_id, user_id)
      DO UPDATE SET status = EXCLUDED.status
    `, [conv.id, userId, initialStatus])

    return res.status(initialStatus === "pending" ? 202 : 200).json({
      success: true,
      status: initialStatus === "pending" ? "pending" : "active",
      message: initialStatus === "pending" ? "Request Submitted. Waiting Admin Approval" : `Successfully joined ${conv.name}`,
      ...(initialStatus === "active" && {
        conversation_id: conv.id
      })
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: "Failed to join Group" })
  }
}
