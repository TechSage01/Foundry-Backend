import jwt from "jsonwebtoken"

export const signAccessToken = (userId: string): string => {
  return jwt.sign(
    { id: userId, type: "access" },
    process.env.JWT_SECRET!,
    { expiresIn: "30m" }
  )
}

export const signRefreshToken = (userId: string): string => {
  return jwt.sign(
    { id: userId, type: "refresh" },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  )
}

export const verifyToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET!)
}