import { Request, Response } from "express";
import { signToken } from "../utils/jwt.js";
import pool from "../config/db.js";
import { v4 as uuidv4 } from "uuid";

export const issueCallbackToken = (req: Request, res: Response) => {
  try {
    const user = req.user as any
    const token = signToken(user.id)

    if (process.env.NODE_ENV === "production") {
      // cookies for prod

      res.cookie("foundry_token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      })

      res.redirect(`${process.env.CLIENT_URL}/auth/callback`)
    }

    // auth headers for dev
    return res.status(200).json({ success: true, message: "Authentication Successful", token: token })
  } catch (error) {
    res.redirect(`${process.env.CLIENT_URL}/signin?error=${error}`)
  }
}

// @route GET /api/auth/me
// @desc Get user details
// @access Authenticated users only
export const getMe = (req: Request, res: Response) => {
  try {
    const user = req.user as any
    if (!user) {
      throw new Error("user not found")
    }

    return res.status(200).json({ success: true, message: "", data: user })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error"})
  }
}

export const signin = async (req: Request, res: Response, next: Function) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN')
    // 1. check if user already exists
    const existingUser = await client.query(
      `SELECT u.id, u.email, u.verified, p.username, p.full_name, p.avatar_url
        FROM users u
        JOIN profiles p ON u.id = p.user_id
        WHERE u.email = $1
    `, [req.body.email])

    if (existingUser.rows.length > 0) {
      await client.query('COMMIT');
      req.user = existingUser.rows[0];
      next();
    }

    // 2. create new user and profile
    const userId = uuidv4();
    const user = await client.query(`
      INSERT INTO users (id, email, verified)
      VALUES ($1, $2, TRUE)
      RETURNING id, email, verified
    `, [userId, req.body.email])

    const username = `habeebamoo_${Math.floor(1000 + Math.random() * 9000)}`;

    await client.query(`
      INSERT INTO profiles (user_id, full_name, username, avatar_url)
      VALUES ($1, $2, $3, $4)
    `, [userId, "Habeeb", username, "https://google.com"]);

    await client.query('COMMIT');
    
    req.user = { id: userId, email: req.body.email};
    next();
  } catch (err) {
    await client.query('ROLLBACK');
    return res.status(500)
  }
}
