import { Request, Response } from "express";
import { v4 as uuidv4, validate as isUuid } from "uuid";
import pool from "../config/db.js";
import { submitOpportunityApplicationSchema } from "../schemas/opportunity.js";

// @route POST /api/opportunities/:id/apply
// @desc Apply for an opportunity
// @access Authenticated users only
export const submitOpportunityApplications = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!id || !isUuid(id)) {
    return res.status(400).json({ success: false, message: "Invalid Opportunity Id" })
  }

  const client = await pool.connect();

  const validation = submitOpportunityApplicationSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid Request",
      error: validation.error.flatten().fieldErrors
    })
  };

  const { cover_note, resume_url, portfolio_url } = validation.data;

  try {
    await client.query('BEGIN')

    // verify opportunity existence
    const opporCheck = await client.query(`
      SELECT id FROM opportunities WHERE id = $1
    `, [id])

    if (opporCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Opportunity Not Found" })
    }

    const applicationId = uuidv4();

    await client.query(`
      INSERT INTO opportunity_applications (
        id, opportunity_id, applicant_id, cover_note, resume_url, portfolio_url, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'submitted')
    `, [
      applicationId,
      id,
      userId,
      cover_note,
      resume_url ?? null,
      portfolio_url ?? null,
    ]);

    await client.query('COMMIT')

    return res.status(201).json({ success: true, message: "Application Submitted" })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error(error)
    return res.status(500).json({ success: false, message: "Failed to submit applications"})
  } finally {
    client.release()
  }
}