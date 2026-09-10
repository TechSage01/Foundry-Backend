import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { createProject, deleteProject, fetchProjects, getProject, getUserProjects, updateProject } from "../controllers/project.js";

const router = Router();

// public
router.get("/", fetchProjects)
router.get("/:slug", getProject)
router.get("/user/:username", getUserProjects)

// authenticated
router.post("/", authMiddleware, createProject)
router.put("/:id", authMiddleware, updateProject)
router.delete("/:id", authMiddleware, deleteProject)

export default router;