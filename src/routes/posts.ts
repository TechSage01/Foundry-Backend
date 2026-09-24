import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { createPost, deletePost, getMyDrafts, getMyPosts, getPost, getPublishedPosts, updatePost } from "../controllers/posts.js";
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

export default router;