import { Request, Response } from "express";
import { createExperienceSchema } from "../schemas/experience.js";
import pool from "../config/db.js";
import { v4 as uuidv4 } from "uuid";

// @route POST /api/experiences
// @desc Create new experience
// @access Authenticated users
export const createExperience = async (req: Request, res: Response) => {
  const userId = req.user?.id

  const validation = createExperienceSchema.safeParse(req.body)
  if (!validation.success) {
    return res.status(400).json({ success: false, message: "Invalid Request", details: validation.error.flatten().fieldErrors })
  }

  try {
    const {
      company_name,
      company_url,
      role,
      location,
      employment_type,
      start_date,
      end_date,
      is_current,
      description,
      technologies,
    } = validation.data;

    const id = uuidv4();

    const { rows } = await pool.query(
      `INSERT INTO experiences (
        id, user_id, company_name, company_url, role, location, employment_type,
        start_date, end_date, is_current, description, technologies
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        id,
        userId,
        company_name,
        company_url ?? null,
        role,
        location ?? null,
        employment_type ?? null,
        start_date,
        end_date ?? null,
        is_current,
        description ?? null,
        technologies,
      ]
    );

    return res.status(200).json({ success: true, message: "Experience added successfully", data: rows[0] })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to add experience: ", error })
  }
}

// @route GET /api/experiences/user/:username
// @desc Fetch all experiences associated with a profile's username
// @access Public
export const getExperiencesByUsername = async (req: Request, res: Response) => {
  const { username } = req.params as { username: string };

  if (!username) {
    return res.status(400).json({ success: false, message: "Username is required" })
  }

  try {
    const { rows } = await pool.query(`
      SELECT 
          e.id,
          e.company_name,
          e.role,
          e.location,
          e.employment_type,
          e.start_date,
          e.end_date,
          e.is_current,
          e.description,
          e.technologies,
          e.created_at
        FROM experiences e
        JOIN profiles p ON e.user_id = p.user_id
        WHERE LOWER(p.username) = LOWER($1)
        ORDER BY e.is_current DESC, e.start_date DESC
    `, [username.trim()])

    if (rows.length < 1) {
      return res.status(404).json({ success: false, message: "Not Found" })
    }

    return res.status(200).json({ success: true, data: rows[0] })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch experiences" })
  }
}