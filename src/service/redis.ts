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

export const storeOtp = async (email: string, code: string) => {
  try {
    const key = `em_${email}_${code}`;
    await rdb.set(key, code, "EX", 300) 
  } catch (error) {
    throw new Error("failed to store otp")
  }
}

export const getOtp = async (email: string, code: string): Promise<string | null> => {
  try {
    const key = `em_${email}_${code}`;
    const value = await rdb.get(key);
    return value ?? null
  } catch {
    throw new Error("failed to verify otp")
  }
}