import { Request, Response } from "express";
import { createCommunitySchema } from "../schemas/community.js";
import { uploadFile } from "../config/imagekit.js";
import { v4 as uuidv4 } from "uuid";
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
      category.trim(), 
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

    return res.status(200).json({ success: true, message: "Community Created", data: communityRes.rows[0] })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error(error)
    return res.status(500).json({ success: false, message: "Failed to create community" })
  }
}