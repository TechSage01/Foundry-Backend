import { Request, Response } from "express";
import { createOpportunitiesSchema } from "../schemas/opportunity.js";
import { v4 as uuidv4 } from "uuid";
import pool from "../config/db.js";

// @route POST /api/opportunities
// @desc create a new opportunity
// @access Authenticated users only
export const createOpportunities = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  try {
    const validation = createOpportunitiesSchema.safeParse(req.body);
    if (!validation.success) {
      const { fieldErrors, formErrors } = validation.error.flatten();

      return res.status(400).json({
        success: false,
        message: "Invalid Request",
        errors: {
          ...fieldErrors,
          ...(formErrors.length > 0 && { _form: formErrors }),
        },
      })
    }

    const { category, title, description, required_skills, work_arrangement, location_range, compensation, deadline_at, fast_apply_enabled, external_apply_url, screening_prompt 
    } = validation.data;

    const normalizedSkills = required_skills.map((skill: string) => skill.trim().toLowerCase());
    const opportunityId = uuidv4();

    const { rows } = await pool.query(
      `INSERT INTO opportunities (
         id,
         user_id,
         category,
         title,
         description,
         required_skills,
         work_arrangement,
         location_range,
         compensation,
         deadline_at,
         fast_apply_enabled,
         external_apply_url,
         screening_prompt
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        opportunityId,
        userId,
        category,
        title.trim(),
        description.trim(),
        normalizedSkills,
        work_arrangement,
        location_range?.trim() ?? null,
        compensation?.trim() ?? null,
        deadline_at ?? null,
        fast_apply_enabled,
        external_apply_url || null,
        screening_prompt?.trim() ?? null,
      ]
    );

    return res.status(201).json({ success: true, message: "Opportunity created successfully", data: rows[0] })
  } catch (err) {
    console.error("Error creating opportunity: ", err)
    return res.status(500).json({ success: false, message: "Failed to create opportunity" })
  }
} 

