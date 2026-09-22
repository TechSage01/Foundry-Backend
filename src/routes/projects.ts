import { Router } from "express";
import { authMiddleware, optionalAuthMiddleware } from "../middlewares/auth.js";
import { createProject, deleteProject, fetchProjects, getProject, getUserProjects, updateProject } from "../controllers/project.js";
import { upload } from "../middlewares/upload.js";
import { uploadLimiter } from "../middlewares/limiter.js";
import { createProjectPhase, deleteProjectPhase, toggleProjectPhase } from "../controllers/projectPhase.js";
import { getProjectLikes, toggleProjectLike } from "../controllers/projectLikes.js";

const router = Router();

// public
router.get("/", fetchProjects)
router.get("/:slug", getProject)
router.get("/user/:username", getUserProjects)
router.get("/:id/likes", optionalAuthMiddleware, getProjectLikes)

// projects
router.post("/", authMiddleware, uploadLimiter, upload.single("cover_image"), createProject)
router.put("/:id", authMiddleware, uploadLimiter, upload.single("cover_image"), updateProject)
router.delete("/:id", authMiddleware, deleteProject)

// project phases
router.post("/:id/phases", authMiddleware, createProjectPhase)
router.patch("/phases/:id/toggle", authMiddleware, toggleProjectPhase)
router.delete("/phases/:id", authMiddleware, deleteProjectPhase)

// project likes
router.post("/:id/likes", authMiddleware, toggleProjectLike)

export default router;