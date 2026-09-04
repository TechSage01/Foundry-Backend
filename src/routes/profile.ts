import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { updateProfile } from "../controllers/profile.js";

const router = Router();

router.put("/", authMiddleware, updateProfile)

export default router;