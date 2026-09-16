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

// @route GET /api/posts
// @desc get all published posts
// @access Public
export const getPublishedPosts = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
         p.id,
         p.title,
         p.slug,
         p.subtitle,
         p.cover_image_url,
         p.tags,
         p.reading_time_minutes,
         p.views_count,
         p.created_at,
         prof.username,
         prof.full_name,
         prof.avatar_url
       FROM posts p
       JOIN profiles prof ON p.user_id = prof.user_id
       WHERE p.is_published = true
       ORDER BY p.created_at DESC`
    );

    return res.status(200).json({ success: true, data: rows })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch posts" })
  }
}

// @route GET /api/posts/:slug
// @desc get a single post
// @access Public
export const getPost = async (req: Request, res: Response) => {
  const { slug } = req.params as { slug: string };

  if (!slug || slug.trim() === "") {
    return res.status(400).json({ success: false, message: "Post slug is required" })
  }

  try {
    const { rows } = await pool.query(
      `WITH updated_post AS (
         UPDATE posts
         SET views_count = views_count + 1
         WHERE slug = $1 AND is_published = true
         RETURNING *
       )
       SELECT 
         up.id,
         up.user_id,
         up.title,
         up.slug,
         up.subtitle,
         up.content,
         up.cover_image_url,
         up.tags,
         up.is_published,
         up.reading_time_minutes,
         up.views_count,
         up.created_at,
         up.updated_at,
         prof.username,
         prof.full_name,
         prof.avatar_url,
         prof.headline
       FROM updated_post up
       JOIN profiles prof ON up.user_id = prof.user_id`,
      [slug.trim().toLowerCase()]
    );

    if (!rows[0]) {
      return res.status(404).json({ success: false, message: "Post not found or is unpublished" })
    }

    return res.status(200).json({ success: true, data: rows[0] })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to get post" })
  }
}