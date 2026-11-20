import { Request } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

export const globalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    if (req.user?.id) return `user:${req.user.id}`;
    return ipKeyGenerator(req.ip ?? "unknown")
  },
  message: {
    success: false,
    message: 'Too many requests, please try again after 10 minutes.',
  },
});

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    if (req.user?.id) return `user:${req.user.id}`;
    return ipKeyGenerator(req.ip ?? "unknown")
  },
  message: {
    success: false,
    message: 'Upload limit reached. Please wait 15 minutes before uploading more files.',
  },
});