import { Router } from "express";
import { authMiddleware, optionalAuthMiddleware } from "../middlewares/auth.js";
import { createCommunity, fetchCommunities, fetchCommunityMembers, getCommunity, getMyCommunities, joinCommunity, leaveCommunity } from "../controllers/community.js";
import { upload } from "../middlewares/upload.js";
import { uploadLimiter } from "../middlewares/limiter.js";
import { createCommunityPost, createCommunityPostComments, fetchCommunityPosts, fetchCommunityPostsComments } from "../controllers/communityPosts.js";

const router = Router();

router.get("/me", authMiddleware, getMyCommunities)

// Public
router.get("/", optionalAuthMiddleware, fetchCommunities)
router.get("/:slug", optionalAuthMiddleware, getCommunity)
router.get("/:slug/members", fetchCommunityMembers)
router.get("/:id/posts", fetchCommunityPosts)
router.get("/:id/posts/:postId/comments", fetchCommunityPostsComments)

// Authenticated
router.post("/", authMiddleware, uploadLimiter, upload.single("icon"), createCommunity)
router.post("/:id/join", authMiddleware, joinCommunity)
router.post("/:id/leave", authMiddleware, leaveCommunity)

// posts
router.post("/:id/posts", 
  authMiddleware, 
  uploadLimiter, 
  upload.fields([
    { name: "image", maxCount: 3 },
  ]),
  createCommunityPost
)

// comments
router.post("/:id/posts/:postId/comments", authMiddleware, createCommunityPostComments)

export default router;