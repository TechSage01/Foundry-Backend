import { Router } from "express";
import { authMiddleware, optionalAuthMiddleware } from "../middlewares/auth.js";
import { createCommunity, fetchCommunities, getCommunity, joinCommunity } from "../controllers/community.js";
import { upload } from "../middlewares/upload.js";

const router = Router();

// Public
router.get("/", optionalAuthMiddleware, fetchCommunities)
router.get("/:slug", getCommunity)

// Authenticated
router.post("/", authMiddleware, upload.single("icon"), createCommunity)
router.post("/:id/join", authMiddleware, joinCommunity)

export default router;