import { Request, Response } from "express";
import { createOpportunitiesSchema, updateOpportunitiesSchema } from "../schemas/opportunity.js";
import { v4 as uuidv4, validate as isUuid } from "uuid";
import pool from "../config/db.js";

// @route POST /api/opportunities
// @desc create a new opportunity
// @access Authenticated users only
export const createOpportunity = async (req: Request, res: Response) => {
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

// @route GET /api/opportunities
// @desc fetch all available opportunities
// @access Public
export const fetchOpportunities = async (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
  const page = Math.max(parseInt(req.query.page as string) || 1, 1);
  const offset = (page - 1) * limit;

  const category = (req.query.category as string)?.toLowerCase();
  const workArrangement = (req.query.work_arrangement as string)?.toLowerCase();
  const skill = (req.query.skill as string)?.toLowerCase();

  try {
    const whereConditions: string[] = [];
    const params: (string | number)[] = [];

    // Filter by Category (full_time, cofounder, bounty, hackathon, grant, freelance)
    if (category) {
      params.push(category);
      whereConditions.push(`o.category = $${params.length}`);
    }

    // Filter by Work Arrangement (remote, hybrid, onsite)
    if (workArrangement) {
      params.push(workArrangement);
      whereConditions.push(`o.work_arrangement = $${params.length}`);
    }

    // Filter by Skill Tag inside PostgreSQL array
    if (skill) {
      params.push(skill);
      whereConditions.push(`$${params.length} = ANY(o.required_skills)`);
    }

    const whereClause =
      whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    const [countResult, opportunitiesResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::INTEGER AS total FROM opportunities o ${whereClause}`,
        params
      ),
      pool.query(
        `SELECT 
           o.id,
           o.category,
           o.title,
           o.description,
           o.required_skills,
           o.work_arrangement,
           o.location_range,
           o.compensation,
           o.deadline_at,
           o.fast_apply_enabled,
           o.external_apply_url,
           o.screening_prompt,
           o.created_at,
           o.updated_at,
           p.username,
           p.full_name,
           p.avatar_url,
           p.headline
         FROM opportunities o
         JOIN profiles p ON o.user_id = p.user_id
         ${whereClause}
         ORDER BY o.created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
    ]);

    const total = countResult.rows[0]?.total ?? 0;

    return res.status(200).json({ 
      success: true,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: opportunitiesResult.rows, 
    })
  } catch (error) {
    
  }
}

// @route GET /api/opportunities/:id
// @desc get a single opportunity
// @access Public
export const getOpportunity = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || !isUuid(id)) {
    return res.status(400).json({ success: false, message: "Invalid Id" })
  }

  try {
    const { rows } = await pool.query(`
      SELECT
        o.id,
        o.category,
        o.title,
        o.description,
        o.required_skills,
        o.work_arrangement,
        o.location_range,
        o.compensation,
        o.deadline_at,
        o.fast_apply_enabled,
        o.external_apply_url,
        o.screening_prompt,
        o.created_at,
        o.updated_at,
        p.username,
        p.full_name,
        p.avatar_url,
        p.headline
      FROM opportunities o
      JOIN profiles p ON o.user_id = p.user_id
      WHERE o.id = $1
    `, [id])

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Opportunity Not Found" })
    }

    return res.status(200).json({ success: true, data: rows[0] })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: "Failed to get opportunity", error })
  }
}

// @route PUT /api/opportunities/:id
// @desc update an opportunity
// @access author only
export const updateOpportunity = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!id || !isUuid(id)) {
    return res.status(400).json({ success: false, message: "Invalid Opportunity Id" })
  }

  const validation = updateOpportunitiesSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid Request",
      errors: validation.error.flatten().fieldErrors
    })
  };

  const { category, title, description, required_skills, work_arrangement, location_range, compensation, deadline_at, fast_apply_enabled, external_apply_url, screening_prompt } = validation.data;

  try {
    const check = await pool.query(`
      SELECT user_id FROM opportunities WHERE id = $1
    `, [id])

    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Opportunity Not Found" })
    }

    if (check.rows[0].user_id != userId) {
      return res.status(403).json({ success: false, message: "Access Denied" })
    }

    const normalizedSkills = required_skills
      ? required_skills.map((s) => s.trim().toLowerCase())
      : null;

    const { rows } = await pool.query(`
      UPDATE opportunities
      SET category = COALESCE($1, category),
          title = COALESCE($2, title),
          description = COALESCE($3, description),
          required_skills = COALESCE($4, required_skills),
          work_arrangement = COALESCE($5, work_arrangement),
          location_range = COALESCE($6, location_range),
          compensation = COALESCE($7, compensation),
          deadline_at = COALESCE($8, deadline_at),
          fast_apply_enabled = COALESCE($9, fast_apply_enabled),
          external_apply_url = COALESCE($10, external_apply_url),
          screening_prompt = COALESCE($11, screening_prompt)
      WHERE id = $12 AND user_id = $13
    `, 
    [
      category?.trim() ?? null,
      title?.trim() ??  null,
      description?.trim() ?? null,
      normalizedSkills ?? null,
      work_arrangement ?? null,
      location_range?.trim() ?? null,
      compensation?.trim() ?? null,
      deadline_at ?? null,
      fast_apply_enabled ?? null,
      external_apply_url ?? null,
      screening_prompt?.trim() ?? null,
      id,
      userId
    ]);


    return res.status(200).json({ success: true, message: "Opportunity Updated" })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: "Failed to update opportunity"})
  }
}

// @route DELETE /api/opportunities/:id
// @desc delete an opportunity
// @access author only
export const deleteOpportunity = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!id || !isUuid(id)) {
    return res.status(400).json({ success: false, message: "Invalid Opportunity Id" })
  }

  try {
    const { rowCount } = await pool.query(`
      DELETE FROM opportunities WHERE id = $1 AND user_id = $2
    `, [id, userId])

    if (rowCount === 0) {
      // existence & ownership check
      const check = await pool.query(`
        SELECT user_id FROM opportunities WHERE id = $1
      `, [id])

      if (check.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Opportunity Not Found" })
      }

      if (check.rows[0].user_id !== userId) {
        return res.status(403).json({ success: false, message: "Access Denied" })
      }
    }

    return res.status(200).json({ success: true, message: "Opportunity deleted successfully" })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete opportunity" })
  }
}