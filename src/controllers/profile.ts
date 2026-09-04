import { Request, Response } from "express";
import { RESERVED_USERNAMES } from "../utils/list.js";
import pool from "../config/db.js";
import { updateProfileSchema } from "../utils/validator.js";

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.user as { id: string }

    if (!id) {
      return res.status(401).json({ success: false, message: "Unauthorized Access" })
    }

    // validate req.body
    const validation = updateProfileSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid Request Payload", 
        details: validation.error.flatten().fieldErrors 
      })
    }

    const { username, full_name, headline, bio, location, skills, external_links } = req.body;
    let cleanUsername: string = "";

    // format check
    if (username !== "") {
      cleanUsername = username.trim().toLowerCase();

      if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
        return res.status(400).json({
          success: false,
          message: 'Username must be 3-30 characters long and contain only letters, numbers, and underscores.',
        });
      }
    }

    // reserved check
    if (RESERVED_USERNAMES.has(cleanUsername)) {
      return res.status(200).json({ success: false, message: "This username cannot be used." })
    }

    // Check if username is taken by another user
    const existingUser = await pool.query(
      `SELECT user_id FROM profiles WHERE LOWER(username) = $1 AND user_id != $2`,
      [cleanUsername, id]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Username is already taken by another user.' });
    }

    const { rows } = await pool.query(
      `UPDATE profiles
        SET 
          username = COALESCE($1, username),
          full_name = COALESCE($2, full_name),
          headline = COALESCE($3, headline),
          bio = COALESCE($4, bio),
          location = COALESCE($5, location),
          skills = COALESCE($6, skills),
          external_links = COALESCE($7, external_links),
          updated_at = NOW()
        WHERE user_id = $8
        RETURNING user_id, username, full_name, headline, bio, avatar_url, location, skills, external_links, updated_at`,
      [
        cleanUsername,
        full_name ?? null,
        headline ?? null,
        bio ?? null,
        location ?? null,
        skills ?? null,
        external_links ? JSON.stringify(external_links) : null,
        id,
      ]
    );

    if (!rows[0]) {
      return res.status(404).json({ success: false, message: "Profile Not Found." })
    }

    return res.status(201).json({ success: true, message: "Profile Updated Successfully "})
  } catch (err) {
    return res.status(500).json({ success: false, message: `Failed to update profile: ${err}` })
  }
}