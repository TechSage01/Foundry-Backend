import { Router } from "express";
import { authMiddleware, optionalAuthMiddleware } from "../middlewares/auth.js";
import { createCommunity, fetchCommunities, getCommunity } from "../controllers/community.js";
import { upload } from "../middlewares/upload.js";

const router = Router();

// Public
router.get("/", optionalAuthMiddleware, fetchCommunities)
router.get("/:slug", getCommunity)

// Authenticated
router.post("/", authMiddleware, upload.single("icon"), createCommunity)

export default router;