import { Request, Response } from "express";
import { createProjectSchema } from "../schemas/project.js";
import { slugify } from "../utils/helpers.js";
import { v4 as uuidv4 } from "uuid";
import pool from "../config/db.js";
import { Project } from "../types/projects.js";

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

export const getProject = async (req: Request, res: Response) => {
  const { slug } = req.params;

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