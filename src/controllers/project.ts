import { Request, Response } from "express";
import { createProjectSchema, updateProjectSchema } from "../schemas/project.js";
import { slugify } from "../utils/helpers.js";
import { v4 as uuidv4 } from "uuid";
import pool from "../config/db.js";
import { Project } from "../types/projects.js";

// @route POST /api/projects
// @desc Create new project
// @access Authenticated users only
export const createProject = async (req: Request, res: Response) => {
  const { id } = req.user as { id: string }

  // validate request
  const validation = createProjectSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, message: 'Validation failed', details: validation.error.flatten().fieldErrors });
  }

  const { title, tagline, description, cover_image_url, demo_url, github_url, tech_stack, is_published } = validation.data;

  const slug = slugify(title);
  const projectId = uuidv4();

  try {
    const { rows } = await pool.query(
      `INSERT INTO projects 
        (id, user_id, title, slug, tagline, description, cover_image_url, demo_url, github_url, tech_stack, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [projectId, id, title, slug, tagline, description, cover_image_url, demo_url, github_url, tech_stack, is_published]
    );

    return res.status(201).json({ success: true, message: "Project Created", data: rows[0] });
  } catch (err) {
    console.error('Error creating project:', err);
    return res.status(500).json({ success: false, message: 'Failed to create project' });
  }
}

// @route GET /api/projects
// @desc Fetch projects
// @access Public
export const fetchProjects = async (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 12, 50);
  const page = Math.max(parseInt(req.query.page as string) || 1, 1);
  const offset = (page - 1) * limit
  const tag = req.query.tag as string | undefined;

  try {
    let query = `
      SELECT 
        p.id,
        p.title,
        p.slug,
        p.tagline,
        p.description,
        p.cover_image_url,
        p.demo_url,
        p.github_url,
        p.tech_stack,
        p.views_count,
        p.created_at,
        prof.username,
        prof.full_name,
        prof.avatar_url
      FROM projects p
      JOIN profiles prof ON p.user_id = prof.user_id
      WHERE p.is_published = true
    `;

    const params: (string | number)[] = [];

    // filter by tech stack array
    if (tag) {
      params.push(tag);
      query += ` AND $${params.length} = ANY(p.tech_stack)`;
    }

    params.push(limit, offset)
    query += ` ORDER BY p.created_at DESC LIMIT $${params.length -1} OFFSET $${params.length}`;

    const { rows } = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      count: rows.length,
      page,
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch projects' }); 
  }
}

// @route GET /api/projects/{slug}
// @desc Get a single project
// @access Public
export const getProject = async (req: Request, res: Response) => {
  const { slug } = req.params;

  if (slug === "") {
    return res.status(400).json({ success: false, message: "Invalid Slug" })
  }

  try {
    const { rows } = await pool.query(
      `UPDATE projects
      SET views_count = views_count + 1
      WHERE slug = $1 AND is_published = true
      RETURNING *
      `
    , [slug])

    if (!rows[0]) {
      return res.status(404).json({ success: false, message: "Project Not Found." })
    }

    const project: Project = rows[0]
    const data = {
      id: project.id,
      title: project.title,
      slug: project.slug,
      tagline: project.tagline,
      description: project.description,
      cover_image_url: project.cover_image_url,
      demo_url: project.demo_url,
      github_url: project.github_url,
      tech_stack: project.tech_stack,
      is_published: project.is_published,
      views_count: project.views_count,
      created_at: project.created_at
    }

    return res.status(200).json({ success: true, message: "", data })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch projects details" })
  }
}

// @route GET /api/projects/user/{username}
// @desc Get all projects from a user
// @access Public
export const getUserProjects = async (req: Request, res: Response) => {
  const { username } = req.params;

  if (username === "") {
    return res.status(400).json({ success: false, message: "Invalid Username" })
  }

  try {
    const { rows } = await pool.query(`
      SELECT p.*
      FROM projects p
      JOIN profiles prof ON p.user_id = prof.user_id
      WHERE LOWER(username) = LOWER($1) AND is_published = true
      ORDER BY p.created_at DESC
    `, [username])

    if (rows.length < 1) {
      return res.status(404).json({ success: false, message: "Projects Not Found" })
    }

    return res.status(200).json({ success: true, message: "", data: rows })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch Projects" })
  }
}

// @route PUT /api/projects/{id}
// @desc Update a project
// @access Owner only
export const updateProject = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (id === "") {
    return res.status(400).json({ success: false, message: "Id Missing" })
  }

  const validation = updateProjectSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, message: "Invalid Request", details: validation.error.flatten().fieldErrors })
  }

  if (!validation.data || Object.keys(validation.data).length === 0) {
    return res.status(400).json({
      success: false,
      message: "At least one field must be provided to update",
    });
  }

  const { title, tagline, description, cover_image_url, demo_url, github_url, tech_stack, is_published } = validation.data;

  try {
    const { rows } = await pool.query(
      `UPDATE projects
       SET
         title = COALESCE($1, title),
         tagline = COALESCE($2, tagline),
         description = COALESCE($3, description),
         cover_image_url = COALESCE($4, cover_image_url),
         demo_url = COALESCE($5, demo_url),
         github_url = COALESCE($6, github_url),
         tech_stack = COALESCE($7, tech_stack),
         is_published = COALESCE($8, is_published),
         updated_at = NOW()
       WHERE id = $9 AND user_id = $10
       RETURNING *`,
      [title, tagline, description, cover_image_url, demo_url, github_url, tech_stack, is_published, id, userId]
    );

    if (!rows[0]) {
      return res.status(404).json({ success: false, message: "Project Not Found" })
    }

    return res.status(200).json({ success: true, message: "Project Updated" })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update project" })
  }
}

// @route DELETE /api/projects/{id}
// @desc Delete a project
// @access Owner only
export const deleteProject = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!id) {
    return res.status(400).json({ success: false, message: "Project ID is required" })
  }

  try {
    const { rowCount } = await pool.query(`
      DELETE FROM projects WHERE id = $1 AND user_id = $2
    `, [id, userId])

    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: "Project Not Found." })
    }

    return res.status(200).json({ success: true, message: "Project Deleted." })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete project" })
  }
}