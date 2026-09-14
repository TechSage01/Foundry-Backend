import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { createExperience, getExperiencesByUsername } from "../controllers/experience.js";

const router = Router();

router.post("/", authMiddleware, createExperience)
router.get("/user/:username", getExperiencesByUsername)

export default router;