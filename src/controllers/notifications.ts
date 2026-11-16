import { Request, Response } from "express";
import { validate as isUuid } from "uuid";
import pool from "../config/db.js";

// @route GET /api/notifications
// @desc Fetch notifications
// @access Authenticated users only
export const getNotifications = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  try {
    const { rows } = await pool.query(`
      WITH unread AS (
      SELECT 
        id, 
        actor_id,
        entity_type,
        entity_id,
        metadata,
        is_read,
        created_at
      FROM notifications
      WHERE recipent_id = $1 AND is_read = false
      ORDER BY created_at DESC
      LIMIT 60
    ),
    read AS (
      SELECT 
        id, 
        actor_id,
        entity_type,
        entity_id,
        metadata,
        is_read,
        created_at
      FROM notifications
      WHERE recipent_id = $1 AND is_read = true
      ORDER BY created_at DESC
      LIMIT GREATEST(0, LEAST(5, 60 - (SELECT COUNT(*) FROM unread)))
    )
    SELECT * FROM unread
    UNION ALL
    SELECT * FROM read
    ORDER BY is_read ASC, created_at DESC;
    `, [userId])

    return res.status(200).json({ success: true, data: rows })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to get notifications"})
  }
}

// @route PATCH /api/notifications/:id
// @desc Mark notification as read
// @access Owners only
export const markNotification = async (req: Request, res: Response) => {
  const id = req.params.id;
  const userId = req.user?.id;

  if (!id || !isUuid(id)) {
    return res.status(400).json({ success: false, message: "Invalid Notification Id" })
  }

  try {
    // verify ownership
    const notificationCheck = await pool.query(`
      SELECT recipent_id FROM notifications WHERE id = $1
    `, [id])

    if (notificationCheck.rows[0].recipent_id !== userId) {
      return res.status(404).json({ success: false, message: "Notification Not Found" })
    }

    // mark notification as read
    await pool.query(`
      UPDATE notifications 
      SET is_read = 'true'
      WHERE id = $1 AND recipent_id = $2
    `, [id, userId])

    return res.status(200).json({ success: true, message: "Notification mark as read" })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to mark notification" })
  }
}