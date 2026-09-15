import { Request, Response } from "express";
import { createPostSchema } from "../schemas/post.js";
import { uploadFile } from "../config/imagekit.js";
import { v4 as uuidv4 } from "uuid";
import { calculateReadingTime, slugify } from "../utils/helpers.js";
import pool from "../config/db.js";

// @route POST /api/posts
// @desc create a new posts
// @access Authenticated users
export const createPost = async (req: Request, res: Response) => {
  const userId = req.user?.id
  const payload = {...req.body}

  if (typeof payload.tags === "string") {
    try {
      payload.tags = JSON.parse(payload.tags);
    } catch {
      payload.tags = payload.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
    }
  }

  if (typeof payload.is_published === "string") {
    payload.is_published = payload.is_published === "true";
  }

  const validation = createPostSchema.safeParse(payload)
  if (!validation.success) {
    return res.status(400).json({ success: false, message: "Invalid Request", details: validation.error.flatten().fieldErrors })
  }

  const { title, subtitle, content, tags, is_published } = validation.data;

  try {
    let coverImageUrl: string | null = validation.data.cover_image_url ?? null;
    if (req.file) {
      coverImageUrl = await uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
    }

    const postId = uuidv4()
    const slug = slugify(title)
    const readingTime = calculateReadingTime(content)
    
    const { rows } = await pool.query(
      `INSERT INTO posts
        (id, user_id, title, slug, subtitle, content, cover_image_url, tags, is_published, reading_time_minutes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::text[], $9, $10)
       RETURNING *`,
      [
        postId,
        userId,
        title,
        slug,
        subtitle ?? null,
        content,
        coverImageUrl,
        tags,
        is_published,
        readingTime,
      ]
    );

    return res.status(200).json({ success: true, message: "Post Created", data: rows[0] })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to create post" })
  }
}