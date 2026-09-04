import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { createProject } from "../controllers/project.js";

const router = Router();

router.post("/", authMiddleware, createProject)
// router.get("/")
// router.get("/:slug")
// router.get("/user/:username")
// router.put("/:id")
// router.delete("/:id")

export default router;