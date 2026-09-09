import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { createProject, getProject, getUserProjects } from "../controllers/project.js";

const router = Router();

router.post("/", authMiddleware, createProject)
router.get("/:slug", getProject)
router.get("/user/:username", getUserProjects)
// router.get("/user/:username")
// router.put("/:id")
// router.delete("/:id")

export default router;