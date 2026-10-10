import { Request, Response } from "express";
import { validate as isUuid } from "uuid";
import pool from "../config/db.js";

// @route POST /api/posts/:id/bookmarks
// @desc Bookmark a post
// @access Authenticated users
export const createPostBookmark = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!id || !isUuid(id)) {
    return res.status(400).json({ success: false, message: "Invalid Post Id" })
  }

  try {
    // verify post existence
    const postCheck = await pool.query(`
      SELECT id FROM posts WHERE id = $1
    `, [id])
    
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Post Not Found" })
    }

    // verify bookmark existence
    const bookmarkCheck = await pool.query(`
      SELECT 1 FROM post_bookmarks WHERE post_id = $1 AND user_id = $2
    `, [id, userId])

    if (bookmarkCheck.rows.length > 0) {
      return res.status(200).json({ success: true, message: "This post have been bookmarked" })
    }

    // insert
    await pool.query(`
      INSERT INTO post_bookmarks (
        post_id, user_id
      ) VALUES ($1, $2)
    `, [id, userId])

    return res.status(201).json({ success: true, message: "Bookmark Successful"})
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: "Failed to bookmark post" })
  }
};

// @route GET /api/posts/me/bookmarks
// @desc Get all my bookmark posts
// @access Authenticated users
export const getMyBookmarks = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  try {
    const { rows } = await pool.query(`
      SELECT
        p.id,
        p.title,
        p.slug,
        p.subtitle,
        p.content,
        p.cover_image_url,
        p.tags,
        p.reading_time_minutes,
        p.views_count,
        p.created_at,
        (SELECT COUNT(*)::INTEGER as likes_count FROM post_likes WHERE post_id = p.id),
        (SELECT COUNT(*)::INTEGER as reposts_count FROM post_reposts WHERE post_id = p.id),
        EXISTS (SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = $1) as is_liked,
        EXISTS (SELECT 1 FROM post_reposts WHERE post_id = p.id AND user_id = $1) as is_reposted
      FROM posts p 
      JOIN post_bookmarks pb ON p.id = pb.post_id AND pb.user_id = $1
      ORDER BY p.created_at DESC
    `, [userId])

    return res.status(200).json({ success: true, data: rows })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: "Failed to fetch bookmarked posts" })
  }
}

// @route DELETE /api/posts/:id/bookmarks
// @desc Remove a bookmarked post
// @access Authenticated users
export const deletePostBookmark = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!id || !isUuid(id)) {
    return res.status(400).json({ success: false, message: "Invalid Post Id" })
  }

  try {
    // verify post existence
    const postCheck = await pool.query(`
      SELECT id FROM posts WHERE id = $1
    `, [id])
    
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Post Not Found" })
    }

    // verify bookmark existence
    const bookmarkCheck = await pool.query(`
      SELECT 1 FROM post_bookmarks WHERE post_id = $1 AND user_id = $2
    `, [id, userId])

    if (bookmarkCheck.rows.length === 0) {
      return res.status(400).json({ success: true, message: "Bookmark Not Found" })
    }

    // insert
    await pool.query(`
      DELETE
        FROM post_bookmarks
      WHERE post_id = $1 AND user_id = $2
    `, [id, userId])

    return res.status(200).json({ success: true, message: "Bookmark Removed"})
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: "Failed to remove post bookmark" })
  }
};