import { Request, Response } from "express";
import { createPhaseSchema, createProjectSchema, updateProjectSchema } from "../schemas/project.js";
import { slugify } from "../utils/helpers.js";
import { v4 as uuidv4, validate as isUuid } from "uuid";
import pool from "../config/db.js";
import { Project } from "../types/projects.js";
import { uploadFile } from "../config/imagekit.js";

// @route POST /api/projects
// @desc Create new project
// @access Authenticated users only
export const createProject = async (req: Request, res: Response) => {
  const { id } = req.user as { id: string }

  const payload = {...req.body};

  if (typeof payload.tech_stack === "string") {
    try {
      payload.tech_stack = JSON.parse(payload.tech_stack);
    } catch {
      payload.tech_stack = payload.tech_stack.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
  }

  if (typeof payload.is_published === "string") {
    payload.is_published = payload.is_published === "true";
  }

  // validate request
  const validation = createProjectSchema.safeParse(payload);
  if (!validation.success) {
    return res.status(400).json({ success: false, message: 'Validation failed', details: validation.error.flatten().fieldErrors });
  }

  const { title, tagline, description, demo_url, github_url, tech_stack, is_published } = validation.data;

  let coverImageUrl: string | null = validation.data.cover_image_url ?? null;
  if (req.file) {
    coverImageUrl = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );
  }

  const slug = slugify(title);
  const projectId = uuidv4();

  try {
    const { rows } = await pool.query(
      `INSERT INTO projects 
        (id, user_id, title, slug, tagline, description, cover_image_url, demo_url, github_url, tech_stack, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::text[], $11)
       RETURNING *`,
      [projectId, id, title, slug, tagline, description, coverImageUrl, demo_url, github_url, tech_stack ?? [], is_published]
    );

    return res.status(201).json({ success: true, message: "Project Created", data: rows[0] });
  } catch (err) {
    console.error('Error creating project:', err);
    return res.status(500).json({ success: false, message: 'Failed to create project' });
  }
}

// @route GET /api/projects
// @desc Fetch all published projects
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

    return res.status(200).json({ success: true, message: "", data: rows[0] })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch projects details" })
  }
}

// @route GET /api/projects/user/{username}
// @desc Get all projects from a user
// @access Public
export const getUserProjects = async (req: Request, res: Response) => {
  const { username } = req.params as { username: string};

  if (!username || username.trim() === "") {
    return res.status(400).json({ success: false, message: "Invalid Username" })
  }

  try {
    const { rows } = await pool.query(
      `SELECT 
         p.id,
         p.title,
         p.slug,
         p.tagline,
         p.description,
         p.cover_image_url,
         p.demo_url,
         p.github_url,
         p.tech_stack,
         p.is_published,
         p.created_at,
         p.updated_at
       FROM projects p
       JOIN profiles prof ON p.user_id = prof.user_id
       WHERE LOWER(prof.username) = LOWER($1) AND p.is_published = true
       ORDER BY p.created_at DESC`,
      [username.trim()]
    );

    if (rows.length < 1) {
      return res.status(404).json({ success: false, message: "Projects Not Found" });
    }

    return res.status(200).json({ success: true, message: "", data: rows });
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

  if (!id || !isUuid(id)) {
    return res.status(400).json({ success: false, message: "Invalid Id" })
  }

  const payload = {...req.body}

  if (typeof payload.tech_stack === "string") {
    try {
      payload.tech_stack = JSON.parse(payload.tech_stack);
    } catch {
      payload.tech_stack = payload.tech_stack.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
  }

  if (typeof payload.is_published === "string") {
    payload.is_published = payload.is_published === "true";
  }

  const validation = updateProjectSchema.safeParse(payload);
  if (!validation.success) {
    return res.status(400).json({ success: false, message: "Invalid Request", details: validation.error.flatten().fieldErrors })
  }

  const hasBodyFields = validation.data && Object.keys(validation.data).length > 0;
  if (!hasBodyFields && !req.file) {
    return res.status(400).json({
      success: false,
      message: "At least one field must be provided to update",
    });
  }

  const { title, tagline, description, demo_url, github_url, tech_stack, is_published } = validation.data;

  try {
    let coverImageUrl: string | null = validation.data.cover_image_url ?? null;
    if (req.file) {
      coverImageUrl = await uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
    }

    // Regenerate slug if a new title was provided
    const newSlug = title ? slugify(title) : null;

    const { rows } = await pool.query(
      `UPDATE projects
       SET
         title = COALESCE($1, title),
         slug = COALESCE($2, slug),
         tagline = COALESCE($3, tagline),
         description = COALESCE($4, description),
         cover_image_url = COALESCE($5, cover_image_url),
         demo_url = COALESCE($6, demo_url),
         github_url = COALESCE($7, github_url),
         tech_stack = COALESCE($8, tech_stack),
         is_published = COALESCE($9, is_published),
         updated_at = NOW()
       WHERE id = $10 AND user_id = $11
       RETURNING *`,
      [title, newSlug, tagline, description, coverImageUrl, demo_url, github_url, tech_stack, is_published, id, userId]
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

  if (!id || !isUuid(id)) {
    return res.status(400).json({ success: false, message: "Invalid Project Id" })
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

// @route POST /api/projects/{id}/phases
// @desc Create a new project phase
// @access Owner only
export const createProjectPhase = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!id || !isUuid(id)) {
    return res.status(400).json({ success: false, message: "Invalid Project Id" })
  }

  const validation = createPhaseSchema.safeParse(req.body)
  if (!validation.success) {
    const { fieldErrors, formErrors } = validation.error.flatten();

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      details: {
      ...fieldErrors,
      ...(formErrors.length > 0 && { _form: formErrors }),
    }})
  }

  try {
    const projectCheck = await pool.query(
      `SELECT user_id FROM projects WHERE id = $1`,
      [id]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    if (projectCheck.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access Denied",
      });
    }

    const { title, description, is_completed } = validation.data;
    const phaseId = uuidv4();

    const { rows } = await pool.query(`
      INSERT INTO project_phases (id, project_id, title, description, is_completed, order_index)
       VALUES (
        $1, 
        $2, 
        $3, 
        $4, 
        $5, 
        COALESCE((SELECT MAX(order_index) FROM project_phases WHERE project_id = $2), 0) + 1
      )
      RETURNING *
    `, [phaseId, id, title, description ?? null, is_completed ])

    return res.status(201).json({ success: true, message: "Phase Created", data: rows[0] })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to create phase" })
  }
}

// @route PATCH /api/projects/phases/{id}/toggle
// @desc Toggle project phase completion status
// @access Owner only
export const toggleProjectPhase = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user;

  if (!id || !isUuid(id)) {
    return res.status(400).json({ success: false, message: "Invalid Project Phase Id" })
  }

  try {
    // Atomic update joining projects table to verify user ownership
    const { rows } = await pool.query(
      `UPDATE project_phases ph
       SET is_completed = NOT ph.is_completed,
           updated_at = NOW()
       FROM projects p
       WHERE ph.id = $1 AND ph.project_id = p.id AND p.user_id = $2
       RETURNING ph.*`,
      [id, userId]
    );

    if (!rows[0]) {
      const check = await pool.query(
        `SELECT p.user_id
         FROM projects p
         JOIN projects_phases ph ON ph.project_id = p.id
         WHERE ph.id = $1`,
        [id]
      );

      if (check.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Project phase not found",
        });
      }

      if (check.rows[0].user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: "Access Denied",
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Phase marked as ${rows[0].is_completed ? "completed" : "incomplete"}`,
      data: rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Failed to toggle project phases`
    });
  }
}

// @route DELETE /api/projects/phases/{id}
// @desc Delete a project phase
// @access Owner only
export const deleteProjectPhase = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!id || !isUuid(id)) {
    return res.status(400).json({ success: false, message: "Invalid Project Phase Id "})
  }

  try {
    const { rowCount } = await pool.query(`
      DELETE FROM project_phases ph
      USING projects p
      WHERE ph.id = $1 AND ph.project_id = p.id AND p.user_id = $2
    `, [id, userId])

    if (rowCount === 0) {
      const check = await pool.query(`
        SELECT p.user_id 
        FROM projects p
        JOIN project_phases ph ON p.id = ph.project_id 
        WHERE ph.id = $1
      `, [id])

      if (check.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Project Phase Not Found" })
      }

      console.log(check.rows[0])
      console.log(userId)

      if (check.rows[0].user_id !== userId) {
        return res.status(403).json({ success: false, message: "Access Denied" })
      }
    }

    return res.status(200).json({ success: true, message: "Project Phase Deleted" })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete project phase" })
  }  
}