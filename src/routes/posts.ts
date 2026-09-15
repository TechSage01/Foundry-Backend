import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { createPost } from "../controllers/posts.js";
import { upload } from "../middlewares/upload.js";

const router = Router();

// Authenticated
router.post("/", authMiddleware, upload.single("cover_image"), createPost)

export default router;