import { Request, Response } from "express";
import { signToken } from "../utils/jwt.js";

export const googleCallback = (req: Request, res: Response) => {
  try {
    const user = req.user as any
    const token = signToken(user.id)

    res.cookie("foundry_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 *60 * 1000
    })

    res.redirect(`${process.env.CLIENT_URL}`)
  } catch (error) {
    res.redirect(`${process.env.CLIENT_URL}`)
  }
}