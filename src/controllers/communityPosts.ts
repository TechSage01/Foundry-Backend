import { Request, Response } from "express";
import { v4 as uuidv4, validate as isUuid } from "uuid";
import pool from "../config/db.js";
import { createCommunityPostSchema } from "../schemas/community.js";
import { uploadFile } from "../config/imagekit.js";
import { calculateReadingTime, slugify } from "../utils/helpers.js";

// @route POST /api/communities/:id/post
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
      SELECT role FROM community_members WHERE user_id = $1
    `, [userId])

    if (membershipCheck.rows.length === 0) {
      return res.status(401).json({ success: false, message: "You must be a member to post in this community" })
    }

    // upload file
    let coverImageUrl: string | null = null;
    if (req.file) {
      coverImageUrl = await uploadFile(
        req.file.buffer,
        req.file.filename,
        req.file.mimetype
      )
    }

    const postId = uuidv4();
    const slug = slugify(title);
    const readingTimeMins = calculateReadingTime(content);

    const { rows } = await pool.query(`
      INSERT INTO community_posts (
        id, community_id, author_id, title, slug, subtitle, content, cover_image_url, reading_time_minutes, views_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0)
    `, [
      postId,
      id,
      userId,
      title,
      slug,
      subtitle ?? null,
      content,
      coverImageUrl,
      readingTimeMins,
    ]);

    return res.status(201).json({ success: true, message: "Post Created.", data: rows[0] })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: "Failed to create community post" })
  }
}