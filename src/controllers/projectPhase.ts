import { Request, Response } from "express";
import { createPhaseSchema } from "../schemas/project.js";
import pool from "../config/db.js";
import { v4 as uuidv4, validate as isUuid } from "uuid";

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
      errors: {
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
  const userId = req.user?.id;

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
         JOIN project_phases ph ON ph.project_id = p.id
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
      message: `Failed to toggle project phases`,
      error
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

      if (check.rows[0].user_id !== userId) {
        return res.status(403).json({ success: false, message: "Access Denied" })
      }
    }

    return res.status(200).json({ success: true, message: "Project Phase Deleted" })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete project phase" })
  }  
}