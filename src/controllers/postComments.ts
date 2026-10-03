import { Request, Response } from "express";
import { v4 as uuidv4, validate as isUuid } from "uuid"
import pool from "../config/db.js";
import { createCommentSchema } from "../schemas/post.js";

// @route POST /api/posts/:id/comments
// @desc  create a post comment
// @access Authenticated users
export const createComment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!id || !isUuid(id)) {
    return res.status(400).json({ success: false, message: "Invalid Post Id" })
  }

  const validation = createCommentSchema.safeParse(req.body)
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid Request",
      errors: validation.error.flatten().fieldErrors
    })
  }

  const { parent_id, content } = validation.data;

  try {
    // verify existence
    const postCheck = await pool.query(`
      SELECT id FROM posts WHERE id = $1
    `, [id])

    if (postCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Post Not Found" })
    }

    // get author details
    const author = await pool.query(`
      SELECT full_name, username, avatar_url FROM profiles WHERE user_id = $1
    `, [userId])

    if (author.rows.length === 0) {
      return res.status(500).json({ success: false, message: "Failed to get author profile" })
    }

    const commentId = uuidv4();
    const user = author.rows[0];

    await pool.query(`
      INSERT INTO comments (
        id, post_id, author_id, author_fullname, author_username, author_avatar_url, parent_id, content
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      commentId,
      id,
      userId,
      user.full_name,
      user.username,
      user.avatar_url,
      parent_id ?? null,
      content
    ])

    return res.status(201).json({ success: true, message: "Comment Created" })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: "Failed to create comment "})
  }
}

// @route GET /api/posts/:id/comments
// @desc fetch posts comments
// @access Public
export const fetchComments = async (req: Request, res: Response) => {
  const { id } = req.params; 
  
  if (!id || !isUuid(id)) {
    return res.status(400).json({ success: false, message: "Invalid Post Id" })
  }

  try {
    const { rows } = await pool.query(`
      SELECT
        id,
        parent_id,
        author_fullname,
        author_username,
        author_avatar_url,
        content
      FROM comments
      WHERE post_id = $1
      ORDER BY created_at DESC
    `, [id])

    return res.status(200).json({ success: true, data: rows })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: "Failed to fetch posts" })
  }
}