import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { createPost, createRepost, deletePost, deleteRepost, getMyDrafts, getMyPosts, getPost, getPublishedPosts, togglePostLike, updatePost } from "../controllers/posts.js";
import { upload } from "../middlewares/upload.js";
import { uploadLimiter } from "../middlewares/limiter.js";

const router = Router();

// Authenticated
router.get("/me", authMiddleware, getMyPosts)
router.get("/me/drafts", authMiddleware, getMyDrafts)

// Public
router.get("/", getPublishedPosts)
router.get("/:slug", getPost)

// Authenticated
router.post("/", authMiddleware, uploadLimiter, upload.single("cover_image"), createPost)
router.put("/:id", authMiddleware, uploadLimiter, upload.single("cover_image"), updatePost)
router.delete("/:id", authMiddleware, deletePost)

router.post("/:id/likes", authMiddleware, togglePostLike)
router.post("/:id/repost", authMiddleware, createRepost)
router.delete("/:id/repost", authMiddleware, deleteRepost)

export default router;