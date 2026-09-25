import { Request, Response } from "express";
import { createExperienceSchema, updateExperienceSchema } from "../schemas/experience.js";
import pool from "../config/db.js";
import { v4 as uuidv4, validate as isUuid } from "uuid";

// @route POST /api/experiences
// @desc Create new experience
// @access Authenticated users
export const createExperience = async (req: Request, res: Response) => {
  const userId = req.user?.id

  const validation = createExperienceSchema.safeParse(req.body)
  if (!validation.success) {
    return res.status(400).json({ success: false, message: "Invalid Request", errors: validation.error.flatten().fieldErrors })
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
// @desc Fetch all experiences associated with a username
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

    return res.status(200).json({ success: true, data: rows })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch experiences" })
  }
}

// @route PUT /api/experiences/:id
// @desc Update an existing experience
// @access Authenticated users
export const updateExperience = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!id || !isUuid(id)) {
    return res.status(400).json({ success: false, message: "Invalid Id" })
  }

  const validation = updateExperienceSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, message: "Invalid Request", errors: validation.error.flatten().fieldErrors })
  }

  const {
    company_name,
    role,
    location,
    employment_type,
    start_date,
    end_date,
    is_current,
    description,
    technologies,
  } = validation.data;

  try {
    const { rows } = await pool.query(
    `UPDATE experiences
      SET
        company_name = COALESCE($1, company_name),
        role = COALESCE($2, role),
        location = COALESCE($3, location),
        employment_type = COALESCE($4, employment_type),
        start_date = COALESCE($5, start_date),
        end_date = COALESCE($6, end_date),
        is_current = COALESCE($7, is_current),
        description = COALESCE($8, description),
        technologies = COALESCE($9::text[], technologies),
        updated_at = NOW()
      WHERE id = $10 AND user_id = $11
      RETURNING *`,
    [
      company_name ?? null,
      role ?? null,
      location ?? null,
      employment_type ?? null,
      start_date ?? null,
      is_current ? null : (end_date ?? null),
      is_current ?? null,
      description ?? null,
      technologies ?? null,
      id,
      userId,
    ])

    if (!rows[0]) {
      const existingRecord = await pool.query(
        `SELECT user_id FROM experiences WHERE id = $1`,
        [id]
      );

      if (existingRecord.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Experience Not Found",
        });
      }

      return res.status(403).json({
        success: false,
        message: "Access Denied",
      });
    }

    return res.status(200).json({ success: true, message: "Experience Updated" })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update experience" })
  }
}

// @route DELETE /api/experiences/:id
// @desc Delete an experience
// @access Authenticated users
export const deleteExperience = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!id || !isUuid(id)) {
    return res.status(400).json({ success: false, message: "Invalid Id" })
  }

  try {
    const { rowCount } = await pool.query(
      `DELETE FROM experiences WHERE id = $1 AND user_id = $2`
    , [id, userId])

    if (rowCount === 0) {
      const check = await pool.query(
        `SELECT user_id FROM experiences WHERE id = $1`
      , [id])

      if (check.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Not Found" })
      }

      return res.status(403).json({ success: false, message: "Access Denied" })
    }

    return res.status(200).json({ success: true, message: "Experience Deleted" })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete experience" })
  }
}