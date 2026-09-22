import { Request, Response } from "express";
import { validate as isUuid } from "uuid";
import pool from "../config/db.js";

// @route POST /api/projects/{id}/likes
// @desc toggle project like status
// @access Authenticated users only
export const toggleProjectLike = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!id || !isUuid(id)) {
    return res.status(400).json({ success: false, message: "Invalid Project Id" })
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // check if projects exists
    const projectCheck = await client.query(`
      SELECT id FROM projects WHERE id = $1
    `, [id])

    if (projectCheck.rows.length === 0) {
      await client.query("ROLLBACK")
      return res.status(404).json({ success: false, message: "Project Not Found" })
    }

    // check if user has already liked project
    const likedCheck = await client.query(`
      SELECT 1 FROM project_likes WHERE user_id = $1 AND project_id = $2
    `, [userId, id])
    
    let isLiked = false;

    if (likedCheck.rows.length > 0) {
      // delete like

      await client.query(`
        DELETE FROM project_likes WHERE user_id = $1 AND project_id = $2
      `, [userId, id])

      isLiked = false;
    } else {
      // create like

      await client.query(`
        INSERT INTO project_likes (user_id, project_id) VALUES ($1, $2)
      `, [userId, id])

      isLiked = true;
    }

    // get total likes count
    const countResult = await client.query(`
      SELECT COUNT(*)::INTEGER AS likes_count FROM project_likes WHERE project_id = $1
    `, [id])

    await client.query("COMMIT")

    return res.status(200).json({
      success: true,
      message: isLiked ? "Project liked" : "Project unliked",
      data: {
        is_liked: isLiked,
        likes_count: countResult.rows[0].likes_count
      }
    })
  } catch (error) {
    await client.query("ROLLBACK")
    return res.status(500).json({ success: false, message: "Failed to toggle project like", error })
  } finally {
    await client.release();
  }
}

// @route GET /api/projects/{id}/likes
// @desc get likes count from projects
// @access Public
export const getProjectLikes = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!id || !isUuid(id)) {
    return res.status(400).json({ success: false, message: "Invalid Project Id" })
  }

  try {
    // check if project exists
    const project = await pool.query(`
      SELECT id FROM projects WHERE id = $1
    `, [id])

    if (project.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Project Not Found" })
    }

    // get count likes
    const countResult = await pool.query(`
      SELECT COUNT(*)::INTEGER AS likes_count FROM project_likes WHERE project_id = $1
    `, [id])

    let isLiked = false;
    if (userId) {
      const likeCheck = await pool.query(`
        SELECT 1 FROM project_likes WHERE user_id = $1 AND project_id = $2
      `, [userId, id])

      isLiked = likeCheck.rows.length > 0;
    }

    return res.status(200).json({
      success: true,
      data: {
        count: countResult.rows[0].likes_count,
        is_liked: isLiked
      }
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to get project likes" })
  }
}