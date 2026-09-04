import { Request, Response } from "express";
import { createProjectSchema } from "../schemas/project.js";
import { slugify } from "../utils/helpers.js";
import { v4 as uuidv4 } from "uuid";
import pool from "../config/db.js";

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

export const getProjects = async (req: Request, res: Response) => {

}