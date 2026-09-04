import { Request, Response } from "express";
import { verifyToken } from "../utils/jwt.js";
import pool from "../config/db.js";

export const authMiddleware = async (req: Request, res: Response, next: Function) => {
  const token = req.cookies.foundry_token;
  
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized Access"})
  }

  try {
    const decoded = verifyToken(token) as { id: string };

    const { rows } = await pool.query(`
      SELECT u.id, u.email, u.verified, p.username, p.full_name, p.headline, p.bio, p.avatar_url, p.location, p.skills, p.external_links
      FROM users u
      JOIN profiles p ON u.id = p.user_id
      WHERE u.id = $1
    `, [decoded.id])

    if (!rows[0]) {
      return res.status(404).json({ success: false, message: "User Not Found" })
    }

    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Forbidden" })
  }
}