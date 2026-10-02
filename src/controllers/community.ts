import { Request, Response } from "express";
import { createCommunitySchema } from "../schemas/community.js";
import { uploadFile } from "../config/imagekit.js";
import { v4 as uuidv4, validate as isUuid } from "uuid";
import pool from "../config/db.js";
import { slugify } from "../utils/helpers.js";

// @route POST /api/communities
// @desc create a new community
// @access authenticated users
export const createCommunity = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  const validation = createCommunitySchema.safeParse(req.body)
  if (!validation.success) {
    return res.status(400).json({ success: false, message: "Invalid Request", errors: validation.error.flatten().fieldErrors })
  }

  const { name, description, category } = validation.data;

  const client = await pool.connect()

  try {
    // upload image
    let iconUrl: string | null = null;

    if (req.file) {
      iconUrl = await uploadFile(
        req.file.buffer,
        req.file.filename,
        req.file.mimetype
      )
    }

    const communityId = uuidv4();
    const slug = slugify(name)

    await client.query('BEGIN')

    // Insert community
    const communityRes = await client.query(`
      INSERT INTO communities (
        id, owner_id, name, slug, category, description, icon_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      communityId, 
      userId, 
      name.trim(), 
      slug.trim().toLowerCase(), 
      category.trim().toLowerCase(), 
      description.trim(), 
      iconUrl ?? null
    ])

    // automatically add user as 'owner'
    await client.query(`
      INSERT INTO community_members (
        community_id, user_id, role
      ) VALUES ($1, $2, 'owner')
    `, [communityId, userId])

    await client.query('COMMIT')

    return res.status(201).json({ success: true, message: "Community Created", data: communityRes.rows[0] })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error(error)
    return res.status(500).json({ success: false, message: "Failed to create community" })
  }
}

// @route GET /api/communities
// @desc Fetch all communities
// @access Public
export const fetchCommunities = async (req: Request, res: Response) => {
  const requestingUserId = req.user?.id || null;

  const limit = Math.min(parseInt(req.query.limit as string) || 12, 50);
  const page = Math.max(parseInt(req.query.page as string) || 1, 1);
  const offset = (page - 1) * limit;

  const category = (req.query.category as string)?.trim();
  const search = (req.query.search as string)?.trim().toLowerCase();

  try {
    const whereConditions: string[] = [];
    const params: (string | number)[] = [];

    if (category && category.toLowerCase() != "all") {
      params.push(category)
      whereConditions.push(`LOWER(category) = LOWER($${params.length})`);
    }

    if (search) {
      params.push(`%${search}%`)
      whereConditions.push(
        `(LOWER(c.name) LIKE $${params.length} OR LOWER(c.description) LIKE $${params.length})`
      );
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    const countQuery = `
      SELECT COUNT(*)::INTEGER AS total
      FROM communities c
      ${whereClause}
    `;

    const limitParamIdx = params.length + 1;
    const offsetParamIdx = params.length + 2;
    const userIdParamIdx = params.length + 3;

    const dataQuery = `
      SELECT
        c.id,
        c.name,
        c.slug,
        c.category,
        c.description,
        c.icon_url,
        c.created_at,
        COUNT(DISTINCT cm.user_id)::INTEGER AS builders_count,
        CASE 
          WHEN $${userIdParamIdx}::UUID IS NULL THEN false
          ELSE EXISTS (
            SELECT 1 
            FROM community_members 
            WHERE community_id = c.id AND user_id = $${userIdParamIdx}::UUID
          )
        END AS is_joined
      FROM communities c
      LEFT JOIN community_members cm ON cm.community_id = c.id
      ${whereClause}
      GROUP BY c.id
      ORDER BY builders_count DESC, c.created_at DESC
      LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx}
    `;

    const queryParams = [...params, limit, offset, requestingUserId];

    const [countResult, communityResult] = await Promise.all([
      pool.query(countQuery, params),
      pool.query(dataQuery, queryParams),
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
      data: communityResult.rows 
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: "Failed to fetch communities" })
  }
}

// @route GET /api/communities/me
// @desc Get all owned community
// @access Authenticated users only
export const getMyCommunities = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  try {
    const { rows } = await pool.query(`
      SELECT
        c.id,
        c.name,
        c.slug,
        c.category,
        c.description,
        c.icon_url,
        c.created_at,
        (
          SELECT COUNT(*)::INTEGER 
          FROM community_members 
          WHERE community_id = c.id
        ) as members
      FROM communities c
      JOIN community_members cm ON c.id = cm.community_id
      WHERE c.owner_id = $1
      ORDER BY cm.joined_at DESC
    `, [userId])

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Communities Not Found" })
    }

    return res.status(200).json({ success: true, data: rows })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: "Failed to get communities" })
  }
}

// @route GET /api/communities/:slug
// @desc Get a community by slug
// @access Public
export const getCommunity = async (req: Request, res: Response) => {
  const { slug } = req.params as { slug: string };

  if (!slug || slug == "") {
    return res.status(400).json({ success: false, message: "Slug is required" })
  }

  const normalizedSlug = slug.trim().toLowerCase();

  try {
    const { rows } = await pool.query(`
      SELECT
        id,
        name,
        description,
        category,
        slug,
        icon_url,
        created_at
      FROM communities
      WHERE slug = $1
    `, [normalizedSlug])

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Community Not Found" })
    }

    return res.status(200).json({ success: true, data: rows[0] })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: "Failed to get community" })
  }
}

// @route POST /api/communities/:id/join
// @desc Join a community
// @access Authenticated users
export const joinCommunity = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!id || !isUuid(id)) {
    return res.status(400).json({ success: false, message: "Invalid Community Id" })
  }

  try {
    // check
    const check = await pool.query(`
      SELECT id FROM communities WHERE id = $1
    `, [id])

    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Community Not Found" })
    }

    const { rowCount } = await pool.query(`
      INSERT INTO community_members (
        community_id, user_id, role
      ) VALUES ($1, $2, 'member')
      ON CONFLICT (community_id, user_id) DO NOTHING
    `, [id, userId])

    if (rowCount === 0) {
      return res.status(409).json({ 
        success: false, 
        message: "You are already a member of this community"
      })
    }

    return res.status(201).json({ success: true, message: "Successfully joined the community"})
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: "Failed to join community" })
  }
}

// @route POST /api/communities/:id/leave
// @desc Leave a community
// @access Authenticated user
export const leaveCommunity = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!id || !isUuid(id)) {
    return res.status(400).json({ success: false, message: "Invalid Community Id" })
  }

  try {
    // community check
    const communityCheck = await pool.query(`
      SELECT
        id
      FROM communities
      WHERE id = $1
    `, [id]);

    if (communityCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Community Not Found" })
    }

    // membership check
    const membershipCheck = await pool.query(`
      SELECT 
        role
      FROM community_members
      WHERE community_id = $1 AND user_id = $2
    `, [id, userId]);

    if (membershipCheck.rows.length === 0) {
      return res.status(400).json({ success: false, message: "You are not a member of this community."})
    }

    if (membershipCheck.rows[0].role === "owner") {
      return res.status(400).json({ success: false, message: "Owners cannot leave their own community, Delete the community instead." })
    }

    await pool.query(`
      DELETE 
      FROM community_members 
      WHERE community_id = $1 AND user_id = $2
    `, [id, userId])

    return res.status(200).json({ success: true, message: "You've left the community"})
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: "Failed to exit community"})
  }
}