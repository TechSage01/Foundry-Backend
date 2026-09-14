import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { createExperience, getExperiencesByUsername, updateExperience } from "../controllers/experience.js";

const router = Router();

// Public
router.get("/user/:username", getExperiencesByUsername)

// Authenticated
router.post("/", authMiddleware, createExperience)
router.put("/:id", authMiddleware, updateExperience)

export default router;