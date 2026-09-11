import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { createExperience } from "../controllers/experience.js";

const router = Router();

router.post("/", authMiddleware, createExperience)

export default router;