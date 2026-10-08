import { Router } from "express";
import { authMiddleware, optionalAuthMiddleware } from "../middlewares/auth.js";
import { createCommunity, fetchCommunities, fetchCommunityMembers, getCommunity, getMyCommunities, joinCommunity, leaveCommunity } from "../controllers/community.js";
import { upload } from "../middlewares/upload.js";
import { uploadLimiter } from "../middlewares/limiter.js";
import { createCommunityPost, fetchCommunityPosts } from "../controllers/communityPosts.js";

const router = Router();

router.get("/me", authMiddleware, getMyCommunities)

// Public
router.get("/", optionalAuthMiddleware, fetchCommunities)
router.get("/:slug", getCommunity)
router.get("/:slug/members", fetchCommunityMembers)
router.get("/:id/posts", fetchCommunityPosts)

// Authenticated
router.post("/", authMiddleware, uploadLimiter, upload.single("icon"), createCommunity)
router.post("/:id/join", authMiddleware, joinCommunity)
router.post("/:id/leave", authMiddleware, leaveCommunity)

router.post("/:id/post", authMiddleware, uploadLimiter, upload.single("cover_image"), createCommunityPost)

export default router;