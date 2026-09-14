import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { createExperience, deleteExperience, getExperiencesByUsername, updateExperience } from "../controllers/experience.js";

const router = Router();

// Public
router.get("/user/:username", getExperiencesByUsername)

// Authenticated
router.post("/", authMiddleware, createExperience)
router.put("/:id", authMiddleware, updateExperience)
router.delete("/:id", authMiddleware, deleteExperience)

export default router;