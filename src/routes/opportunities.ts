import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { createOpportunity, deleteOpportunity, fetchOpportunities, getOpportunity, updateOpportunity } from "../controllers/opportunities.js";

const router = Router();

// Public
router.get("/", fetchOpportunities)
router.get("/:id", getOpportunity)

// Authenticated
router.post("/", authMiddleware, createOpportunity);
router.put("/:id", authMiddleware, updateOpportunity)
router.delete("/:id", authMiddleware, deleteOpportunity)

export default router;