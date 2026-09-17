import { Request, Response } from "express";
import { createPostSchema, updatePostSchema } from "../schemas/post.js";
import { uploadFile } from "../config/imagekit.js";
import { v4 as uuidv4, validate as isUuid } from "uuid";
import { calculateReadingTime, slugify } from "../utils/helpers.js";
import pool from "../config/db.js";
import { deflate } from "node:zlib";

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

// @route PUT /api/posts/:id
// @desc update a post
// @access Authenticated users
export const updatePost = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id

  if (!id || !isUuid(id)) {
    return res.status(400).json({ success: false, message: "Invalid Post Id" })
  }

  const payload = { ...req.body };

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

  const validation = updatePostSchema.safeParse(payload)
  const hasBodyFields = validation.success && Object.keys(validation.data).length > 0;

  if (!hasBodyFields && !req.file) {
    return res.status(400).json({
      success: false,
      message: "At least one field or image must be provided to update",
    });
  };

  if (!validation.success) {
    return res.status(400).json({ success: false, message: "Invalid Request", details: validation.error.flatten().fieldErrors})
  }

  const { title, subtitle, content, tags, is_published } = validation.data;

  try {
    const check = await pool.query(
      `SELECT user_id, created_at FROM posts WHERE id = $1`,
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    if (check.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access Denied",
      });
    }

    // enforce 10 minutes window for posts update
    const TEN_MINUTES_MS = 10 * 60 * 1000;
    const createdAtMs = new Date(check.rows[0].created_at).getTime();

    if (Date.now() - createdAtMs > TEN_MINUTES_MS) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Posts can only be edited within 10 minutes of creation",
      });
    }

    let coverImageUrl: string | null = validation.data.cover_image_url ?? null;

    if (req.file) {
      coverImageUrl = await uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
    }

    const newSlug = title ? slugify(title) : null;
    const readingTime = content ? calculateReadingTime(content) : null;

    const { rows } = await pool.query(
      `UPDATE posts
       SET
         title = COALESCE($1, title),
         slug = COALESCE($2, slug),
         subtitle = COALESCE($3, subtitle),
         content = COALESCE($4, content),
         cover_image_url = COALESCE($5, cover_image_url),
         tags = COALESCE($6::text[], tags),
         is_published = COALESCE($7, is_published),
         reading_time_minutes = COALESCE($8, reading_time_minutes),
         updated_at = NOW()
       WHERE id = $9 AND user_id = $10 AND created_at >= NOW() - INTERVAL '10 minutes'
       RETURNING *`,
      [
        title ?? null,
        newSlug,
        subtitle ?? null,
        content ?? null,
        coverImageUrl,
        tags ?? null,
        is_published ?? null,
        readingTime,
        id,
        userId,
      ]
    );

    return res.status(200).json({ success: true, message: "Post Updated", data: rows[0] })
  } catch (error) { 
    return res.status(500).json({ success: false, message: "Failed to update post", error })
  }
}