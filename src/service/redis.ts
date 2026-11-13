import rdb from "../config/redis.js";
import { verifyToken } from "../utils/jwt.js";

export const blacklistToken = async (token: string) => {
  try{
    const decoded = verifyToken(token) as { exp?: number }
    if (!decoded || !decoded.exp) {
      throw new Error("Failed to verify token")
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const ttlSeconds = decoded.exp - currentTime;

    if (ttlSeconds > 0) {
      const key = `bl_token:${token}`;
      await rdb.set(key, "revoked", "EX", ttlSeconds)
    }
  } catch (err) {
    throw err
  }
}

export const isBlacklist = async (token: string): Promise<boolean> => {
  try {
    const key = `bl_token:${token}`;
    const exists = await rdb.exists(key);

    return exists === 1
  } catch (error) {
    throw error
  }
}