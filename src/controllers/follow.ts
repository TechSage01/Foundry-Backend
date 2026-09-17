import { Request, Response } from "express";
import { validate as isUuid } from "uuid";
import pool from "../config/db.js";

// @route POST /api/users/:id/follow
// @desc follow a user
// @access Authenticated users only
export const followUser = async (req: Request, res: Response) => {
  const followerId = req.user?.id;
  const { id: followingId } = req.params;

  if (!followingId || !isUuid(followingId)) {
    return res.status(400).json({ success: false, message: "Invalid User Id" })
  }

  if (followerId === followingId) {
    return res.status(400).json({ success: false, message: "You cannot follow yourself." })
  }

  try {
    const targetCheck = await pool.query(`SELECT id FROM users WHERE id = $1`, [followingId]);
    if (targetCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { rowCount } = await pool.query(
      `INSERT INTO follows (follower_id, following_id)
       VALUES ($1, $2)
       ON CONFLICT (follower_id, following_id) DO NOTHING`,
      [followerId, followingId]
    );

    if (rowCount === 0) {
      return res.status(400).json({ success: false, message: "You are already following this user" });
    }

    return res.status(201).json({ success: true, message: "User followed successfully" })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to follow user" })
  }
}

// @route DELETE /api/users/:id/follow
// @desc unfollow a user
// @access Authenticated users only
export const unFollowUser = async (req: Request, res: Response) => {
  const followerId = req.user?.id;
  const { id: followingId } = req.params;

  if (!followingId || !isUuid(followingId)) {
    return res.status(400).json({ success: false, message: "Invalid User Id" });
  }

  try {
    const { rowCount } = await pool.query(
      `DELETE FROM follows WHERE follower_id = $1 AND following_id = $2`,
      [followerId, followingId]
    );

    if (rowCount === 0) {
      return res.status(400).json({ success: false, message: "You are not following this user" });
    }

    return res.status(200).json({ success: true, message: "User unfollowed successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to unfollow user" });
  }
}

// @route GET /api/users/:username/followers
// @desc  Get list of followers for a user
// @access Public
export const getFollowers = async (req: Request, res: Response) => {
  const { username } = req.params as { username: string };

  if (!username || username.trim() === "") {
    return res.status(400).json({ success: false, message: "Username is required" });
  }

  try {
    const { rows } = await pool.query(
      `SELECT prof.username, prof.full_name, prof.avatar_url, prof.headline
       FROM follows f
       JOIN profiles prof ON f.follower_id = prof.user_id
       JOIN profiles target_prof ON f.following_id = target_prof.user_id
       WHERE LOWER(target_prof.username) = LOWER($1)
       ORDER BY f.created_at DESC`,
      [username.trim()]
    );

    return res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch followers" });
  }
};

// @route   GET /api/users/:username/following
// @desc    Get list of users a user is following
// @access  Public
export const getFollowing = async (req: Request, res: Response) => {
  const { username } = req.params as { username: string };

  if (!username || username.trim() === "") {
    return res.status(400).json({ success: false, message: "Username is required" });
  }

  try {
    const { rows } = await pool.query(
      `SELECT prof.username, prof.full_name, prof.avatar_url, prof.headline
       FROM follows f
       JOIN profiles prof ON f.following_id = prof.user_id
       JOIN profiles target_prof ON f.follower_id = target_prof.user_id
       WHERE LOWER(target_prof.username) = LOWER($1)
       ORDER BY f.created_at DESC`,
      [username.trim()]
    );

    return res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error("Error fetching following:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch following" });
  }
};