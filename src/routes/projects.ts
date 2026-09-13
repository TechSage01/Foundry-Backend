import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { createProject, deleteProject, fetchProjects, getProject, getUserProjects, updateProject } from "../controllers/project.js";
import { upload } from "../middlewares/upload.js";

const router = Router();

// public
router.get("/", fetchProjects)
router.get("/:slug", getProject)
router.get("/user/:username", getUserProjects)

// authenticated
router.post("/", authMiddleware, upload.single("cover_image"), createProject)
router.put("/:id", authMiddleware, upload.single("cover_image"), updateProject)
router.delete("/:id", authMiddleware, deleteProject)

export default router;