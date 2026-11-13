import { Request, Response } from "express";
import { verifyToken } from "../utils/jwt.js";
import pool from "../config/db.js";
import { isBlacklist } from "../service/redis.js";

export const authMiddleware = async (req: Request, res: Response, next: Function) => {
  const token = process.env.NODE_ENV === "production" 
    ? req.cookies.foundry_token 
    : req.header("Authorization");
  
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized Access"})
  }

  const isBlacklisted = await isBlacklist(token);
  if (isBlacklisted) {
    return res.status(401).json({ success: false, message: "Invalid Token" })
  }

  try {
    const decoded = verifyToken(token) as { id: string };

    const { rows } = await pool.query(`
      SELECT u.id, u.email, u.verified, p.username, p.full_name, p.headline, p.bio, p.avatar_url, p.cover_image_url, p.location, p.skills, p.external_links
      FROM users u
      JOIN profiles p ON u.id = p.user_id
      WHERE u.id = $1
    `, [decoded.id])

    if (!rows[0]) {
      return res.status(404).json({ success: false, message: "User Not Found" })
    }

    req.user = rows[0];
    res.locals.token = token;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Unauthorized Access" })
  }
}

export const requireRefreshToken = async (req: Request, res: Response, next: Function) => {
  const accessToken = process.env.NODE_ENV === "production"
    ? req.cookies.foundry_token
    : req.header("Authorization")

  const refreshToken = process.env.NODE_ENV === "production" 
    ? req.cookies.foundry_refresh
    : req.header("Refresh")

  if (!refreshToken) {
    return res.status(401).json({ success: false, message: "Unauthorized Access" })
  }

  const isBlacklisted = await isBlacklist(refreshToken);
  if (isBlacklisted) {
    return res.status(401).json({ success: false, message: "Invalid Token" })
  }

  try {
    const decoded = verifyToken(refreshToken) as { id: string, type: string };

    const { rows } = await pool.query(`
      SELECT u.id, u.email, u.verified, p.username, p.full_name, p.headline, p.bio, p.avatar_url, p.cover_image_url, p.location, p.skills, p.external_links
      FROM users u
      JOIN profiles p ON u.id = p.user_id
      WHERE u.id = $1
    `, [decoded.id])

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: "User Not Found" })
    }

    req.user = rows[0];
    res.locals.token = accessToken;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Unauthorized Access" })
  }
}

export const optionalAuthMiddleware = async (req: Request, res: Response, next: Function) => {
  const token = process.env.NODE_ENV === "production" ? req.cookies.foundry_token : req.header("Authorization");
  
  if (!token) {
    return next();
  }

  const isBlacklisted = await isBlacklist(token);
  if (isBlacklisted) {
    return res.status(401).json({ success: false, message: "Invalid Token" })
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