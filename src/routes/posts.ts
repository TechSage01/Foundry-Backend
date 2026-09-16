import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { createPost, getPost, getPublishedPosts } from "../controllers/posts.js";
import { upload } from "../middlewares/upload.js";

const router = Router();

// Public
router.get("/", getPublishedPosts)
router.get("/:slug", getPost)

// Authenticated
router.post("/", authMiddleware, upload.single("cover_image"), createPost)

export default router;