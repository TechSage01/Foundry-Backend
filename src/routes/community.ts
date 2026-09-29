import { Router } from "express";
import { authMiddleware, optionalAuthMiddleware } from "../middlewares/auth.js";
import { createCommunity, fetchCommunities, getCommunity, joinCommunity, leaveCommunity } from "../controllers/community.js";
import { upload } from "../middlewares/upload.js";
import { uploadLimiter } from "../middlewares/limiter.js";

const router = Router();

// Public
router.get("/", optionalAuthMiddleware, fetchCommunities)
router.get("/:slug", getCommunity)

// Authenticated
router.post("/", authMiddleware, uploadLimiter, upload.single("icon"), createCommunity)
router.post("/:id/join", authMiddleware, joinCommunity)
router.post("/:id/leave", authMiddleware, leaveCommunity)

export default router;