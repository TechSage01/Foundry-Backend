import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { createCommunity } from "../controllers/community.js";
import { upload } from "../middlewares/upload.js";

const router = Router();

// Authenticated
router.post("/", authMiddleware, upload.single("icon"), createCommunity)

export default router;