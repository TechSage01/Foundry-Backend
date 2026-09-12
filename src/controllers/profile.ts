import { Request, Response } from "express";
import { RESERVED_USERNAMES } from "../utils/list.js";
import pool from "../config/db.js";
import { updateProfileSchema } from "../schemas/profile.js";
import { uploadFile } from "../config/imagekit.js";

// @route PUT /api/profile
// @desc Update profile
// @access Authenticated users only
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.user as { id: string }

    if (!id) {
      return res.status(401).json({ success: false, message: "Unauthorized Access" })
    }

    const payload = {...req.body};

    if (typeof payload.skills === "string") {
      try {
        payload.skills = JSON.parse(payload.skills)
      } catch {
        payload.skills = payload.skills.split(', ').map((s: string) => s.trim()).filter(Boolean)
      }
    }

    if (typeof payload.external_links === 'string') {
      try {
        payload.external_links = JSON.parse(payload.external_links);
      } catch {
        payload.external_links = null;
      }
    }

    // validate req.body
    const validation = updateProfileSchema.safeParse(payload);
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid Request Payload", 
        details: validation.error.flatten().fieldErrors 
      })
    }

    const { username, full_name, headline, bio, location, skills, external_links } = validation.data;
    let cleanUsername: string = "";

    if (username && username.trim() !== '') {
      cleanUsername = username.trim().toLowerCase();

      if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
        return res.status(400).json({
          success: false,
          message: 'Username must be 3-30 characters long and contain only letters, numbers, and underscores.',
        });
      }

      if (RESERVED_USERNAMES.has(cleanUsername)) {
        return res.status(400).json({ success: false, message: 'This username cannot be used.' });
      }

      const existingUser = await pool.query(
        `SELECT user_id FROM profiles WHERE LOWER(username) = $1 AND user_id != $2`,
        [cleanUsername, id]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({ success: false, message: 'Username is already taken by another user.' });
      }
    }

    let avatarUrl: string | null = null;

    if (req.file) {
      avatarUrl = await uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      )
    }

    const { rows } = await pool.query(
      `UPDATE profiles
        SET 
          username = COALESCE($1, username),
          full_name = COALESCE($2, full_name),
          headline = COALESCE($3, headline),
          bio = COALESCE($4, bio),
          location = COALESCE($5, location),
          avatar_url = COALESCE ($6, avatar_url),
          skills = COALESCE($7, skills),
          external_links = COALESCE($8, external_links),
          updated_at = NOW()
        WHERE user_id = $9
        RETURNING user_id, username, full_name, headline, bio, avatar_url, location, skills, external_links, updated_at`,
      [
        cleanUsername,
        full_name ?? null,
        headline ?? null,
        bio ?? null,
        location ?? null,
        avatarUrl,
        skills ?? null,
        external_links ? JSON.stringify(external_links) : null,
        id,
      ]
    );

    if (!rows[0]) {
      return res.status(404).json({ success: false, message: "Profile Not Found." })
    }

    return res.status(200).json({ success: true, message: "Profile Updated Successfully "})
  } catch (err) {
    return res.status(500).json({ success: false, message: `Failed to update profile: ${err}` })
  }
}