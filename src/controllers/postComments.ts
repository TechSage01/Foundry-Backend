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

    const commentId = uuidv4();

    await pool.query(`
      INSERT INTO comments (
        id, post_id, author_id, parent_id, content
      ) VALUES ($1, $2, $3, $4, $5)
    `, [
      commentId,
      id,
      userId,
      parent_id ?? null,
      content
    ])

    return res.status(201).json({ success: true, message: "Comment Created" })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: "Failed to create comment "})
  }
}