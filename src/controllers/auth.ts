import { Request, Response } from "express";
import { signToken } from "../utils/jwt.js";

export const issueCallbackToken = (req: Request, res: Response) => {
  try {
    const user = req.user as any
    const token = signToken(user.id)

    res.cookie("foundry_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    })

    res.redirect(`${process.env.CLIENT_URL}/auth/callback`)
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
