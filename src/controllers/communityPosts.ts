import { Request, Response } from "express";
import { v4 as uuidv4, validate as isUuid } from "uuid";
import pool from "../config/db.js";
import { createCommunityPostSchema } from "../schemas/community.js";
import { uploadFile } from "../config/imagekit.js";
import { buildCommentTree, calculateReadingTime, slugify } from "../utils/helpers.js";
import { createCommentSchema } from "../schemas/post.js";

// @route POST /api/communities/:id/posts
// @desc Create a new community post
// @access Authenticated users & community members only
export const createCommunityPost = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const payload = {...req.body};

  if (!id || !isUuid(id)) {
    return res.status(400).json({ success: false, message: "Invalid Community Id" })
  }

  const validation = createCommunityPostSchema.safeParse(payload);
  if (!validation.success) {
    return res.status(400).json({ 
      success: false, 
      message: "Invalid Request",
      errors: validation.error.flatten().fieldErrors
    })
  }

  const { title, subtitle, content } = validation.data;

  const uploadedFiles = (
    Array.isArray(req.files) 
      ? req.files 
      : (req.files as { [fieldname: string]: Express.Multer.File[] })?.["image"]
  ) ?? [];

  try {
    // verify community existence
    const communityCheck = await pool.query(`
      SELECT id FROM communities WHERE id = $1
    `, [id])

    if (communityCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Community Not Found" })
    }

    // verify membership
    const membershipCheck = await pool.query(`
      SELECT role FROM community_members WHERE community_id = $1 AND user_id = $2
    `, [id, userId])

    if (membershipCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: "You must be a member to post in this community" })
    }

    const mediaUrls: string[] = await Promise.all(
      uploadedFiles.map((file) => 
        uploadFile(file.buffer, file.originalname, file.mimetype)
      )
    );

    const postId = uuidv4();
    const slug = slugify(title);
    const readingTimeMins = calculateReadingTime(content);

    const { rows } = await pool.query(`
      INSERT INTO community_posts (
        id, community_id, author_id, title, slug, subtitle, content, media_url, reading_time_minutes, views_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::TEXT[], $9, 0)
      RETURNING *
    `, [
      postId,
      id,
      userId,
      title,
      slug,
      subtitle ?? null,
      content,
      mediaUrls,
      readingTimeMins,
    ]);

    return res.status(201).json({ success: true, message: "Post Created.", data: rows[0] })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to create community post" })
  }
}

// @route GET /api/communities/:id/posts
// @desc Fetch community posts
// @access Public
export const fetchCommunityPosts = async (req: Request, res: Response) => {
  const { id } = req.params;

  const limit = Math.min(parseInt(req.query.limit as string) || 12, 50);
  const page = Math.max(parseInt(req.query.page as string) || 1, 1);
  const offset = (page - 1) * limit

  if (!id || !isUuid(id)) {
    return res.status(400).json({ success: false, message: "Invalid Community Id" })
  }

  try {
    // verify community existence
    const communityCheck = await pool.query(`
      SELECT id FROM communities WHERE id = $1
    `, [id])

    if (communityCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Community Not Found" })
    }

    const { rows } = await pool.query(`
      SELECT
        cp.id,
        cp.title,
        cp.slug,
        cp.subtitle,
        cp.content,
        cp.media_url,
        cp.reading_time_minutes,
        cp.views_count,
        cp.created_at,
        (SELECT username FROM profiles WHERE user_id = cp.author_id) AS author_username,
        (SELECT full_name FROM profiles WHERE user_id = cp.author_id) AS author_fullname,
        (SELECT avatar_url FROM profiles WHERE user_id = cp.author_id) AS author_avatar_url
      FROM community_posts cp 
      WHERE community_id = $1
      ORDER BY cp.created_at DESC
      LIMIT $2 OFFSET $3
    `, [id, limit, offset])

    return res.status(200).json({ success: true, data: rows })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: "Failed to fetch community post" })
  }
}

// @route POST /api/communities/:id/posts/:postId/comments
// @desc Create a comment for a community post
// @access Authenticated users & community members only
export const createCommunityPostComments = async (req: Request, res: Response) => {
  const { id, postId } = req.params;
  const userId = req.user?.id;

  if (!id || !postId || !isUuid(id) || !isUuid(postId)) {
    return res.status(400).json({ success: false, message: "Invalid Community or Post Id" })
  }

  const validation = createCommentSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid Request",
      errors: validation.error.flatten().fieldErrors
    })
  }

  const { parent_id, content } = validation.data;

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // verify community existence
    const communityCheck = await client.query(`
      SELECT id FROM communities WHERE id = $1
    `, [id])

    if (communityCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Community Not Found" })
    }

    // verify community posts existence
    const postCheck = await client.query(`
      SELECT 1 FROM community_posts WHERE community_id = $1 AND id = $2
    `, [id, postId])

    if (postCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Post Not Found" })
    }

    // get author details
    const author = await client.query(`
      SELECT full_name, username, avatar_url FROM profiles WHERE user_id = $1
    `, [userId])

    const commentId = uuidv4();
    const user = author.rows[0];

    await client.query(`
      INSERT INTO community_comments (
        id, community_id, post_id, author_id, author_fullname, author_username, author_avatar_url, parent_id, content
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      commentId,
      id,
      postId,
      userId,
      user.full_name,
      user.username,
      user.avatar_url,
      parent_id ?? null,
      content
    ])

    await client.query('COMMIT')

    return res.status(201).json({ success: true, message: "Comment Created" })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error(error)
    return res.status(500).json({ success: false, message: "Failed to create comment" })
  } finally {
    client.release()
  }
}

// @route GET /api/communities/:id/posts/:postId/comments
// @desc Fetch comments for a community post
// @access Public
export const fetchCommunityPostsComments = async (req: Request, res: Response) => {
  const { id, postId } = req.params;

  if (!id || !postId || !isUuid(id) || !isUuid(postId)) {
    return res.status(400).json({ success: false, message: "Invalid Community or Post Id" })
  }

  const client = await pool.connect()

  try {

    await client.query('BEGIN')

    // verify community existence
    const communityCheck = await client.query(`
      SELECT id FROM communities WHERE id = $1
    `, [id])

    if (communityCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Community Not Found" })
    }
    
    // verify post existence
    const postCheck = await client.query(`
      SELECT id FROM community_posts WHERE community_id = $1 AND id = $2
    `, [id, postId])

    if (postCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Post Not Found" })
    }

    const { rows } = await client.query(`
      SELECT 
        id,
        parent_id,
        author_fullname,
        author_username,
        author_avatar_url,
        content
      FROM community_comments
      WHERE community_id = $1 AND post_id = $2
    `, [id, postId]);

    await client.query('COMMIT')

    const nestedComments = buildCommentTree(rows)
    
    return res.status(200).json({ success: true, data: nestedComments })
  } catch(error) {
    await client.query('ROLLBACK')
    console.error(error)
    return res.status(500).json({ success: false, message: "Failed to fetch comments." })
  } finally {
    client.release()
  }
}