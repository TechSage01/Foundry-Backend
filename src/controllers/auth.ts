import { Request, Response } from "express";
import { signAccessToken, signRefreshToken } from "../utils/jwt.js";
import pool from "../config/db.js";
import { v4 as uuidv4 } from "uuid";
import { blacklistToken, getOtp, storeOtp } from "../service/redis.js";
import { emailSchema, otpSchema } from "../schemas/auth.js";
import { extractUsername, generateOtp } from "../utils/helpers.js";
import { sendOtpMail } from "../service/mailer.js";

export const issueCallbackToken = (req: Request, res: Response) => {
  try {
    const user = req.user as any;

    const accessToken = signAccessToken(user.id)
    const refreshToken = signRefreshToken(user.id)

    if (process.env.NODE_ENV === "production") {
      // access token
      res.cookie("foundry_token", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 30 * 60 * 1000 // 30 mins
      })

      // refresh token
      res.cookie("foundry_refresh", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      })

      return res.redirect(`${process.env.CLIENT_URL}/auth/callback`)
    }

    // auth headers for dev
    return res.status(200).json({ 
      success: true, 
      message: "Authentication Successful", 
      accessToken: accessToken,
      refreshToken: refreshToken 
    })
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

    return res.status(200).json({ success: true, data: user })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error"})
  }
}

// @route GET /api/auth/refresh
// @desc Get new access token
// @access Authenticated users
export const renewAccessToken = async (req: Request, res: Response) => {
  const user = req.user as any;
  const oldAccessToken = res.locals.token; 

  try {
    if (oldAccessToken) {
      await blacklistToken(oldAccessToken);
    }

    const token = signAccessToken(user.id);

    if (process.env.NODE_ENV === "production") {
      res.cookie("foundry_token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 30 * 60 * 1000 // 30 mins
      })
    }

    return res.status(200).json({ 
      success: true, 
      message: "Refresh Successful", 
      ...(process.env.NODE_ENV === "development" && {
        accessToken: token
      })
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to refresh access token" })
  }
}

export const requestOtp = async (req: Request, res: Response) => {
  const validation = emailSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ 
      success: false,
      message: "Invalid Request",
      errors: validation.error.flatten().fieldErrors
    })
  }

  const { email } = validation.data;

  try {
    const otp = generateOtp();

    await storeOtp(email, otp);

    await sendOtpMail(email, otp)

    return res.status(200).json({ success: true, message: "Check your inbox for an OTP" })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to send OTP" })
  }
}

export const verifyOtp = async (req: Request, res: Response, next: Function) => {
  const validation = otpSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid Request",
      errors: validation.error.flatten().fieldErrors
    })
  }

  const { email, code } = validation.data;

  const client = await pool.connect();

  try {
    // verify otp
    const valid = await getOtp(email, code)
    if (!valid) {
      return res.status(403).json({ success: false, message: "Invalid Otp" })
    }

    await client.query('BEGIN')

    // check user existence
    const existingUser = await client.query(`
      SELECT u.id, u.email, u.verified, p.username, p.full_name, p.avatar_url
      FROM users u
      JOIN profiles p ON u.id = p.user_id
      WHERE u.email = $1
    `, [email])

    if (existingUser.rows.length > 0) {
      req.user = existingUser.rows[0];
      next();
      return
    }

    // 2. create new user and profile
    const userId = uuidv4();

    const user = await client.query(`
      INSERT INTO users (id, email, verified)
      VALUES ($1, $2, TRUE)
      RETURNING id, email, verified
    `, [userId, email])

    const username = `${extractUsername(email)}_${Math.floor(1000 + Math.random() * 9000)}`;

    await client.query(`
      INSERT INTO profiles (user_id, full_name, username)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [userId, extractUsername(email), username]);

    await client.query('COMMIT');

    req.user = user.rows[0];
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error" })
  }
}

// @route POST /api/auth/logout
// @desc Logout user
// @access Authenticated users
export const logout = async (req: Request, res: Response) => {
  const token = res.locals.token;
  const refreshToken = res.locals.refreshToken;

  try {
    await blacklistToken(token) 
    await blacklistToken(refreshToken)

    res.clearCookie("foundry_token")
    res.clearCookie("foundry_refresh")
    
    return res.status(200).json({ success: true, message: "Logged out Successfully" })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to logout" })
  }
}

export const signin = async (req: Request, res: Response, next: Function) => {
  const { email, name } = req.body;
  if (!email || email == "" || !name || name == "") {
    return res.status(400).json({ error: "body incomplete" })
  }
  
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

    const username = `${name}_${Math.floor(1000 + Math.random() * 9000)}`;

    await client.query(`
      INSERT INTO profiles (user_id, full_name, username, avatar_url)
      VALUES ($1, $2, $3, $4)
    `, [userId, name, username, "https://google.com"]);

    await client.query('COMMIT');
    
    req.user = { id: userId, email: req.body.email};
    next();
  } catch (err) {
    await client.query('ROLLBACK');
    return res.status(500)
  }
}
