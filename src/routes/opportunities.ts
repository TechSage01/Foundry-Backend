import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { createOpportunities, fetchOpportunities, getOpportunity } from "../controllers/opportunities.js";

const router = Router();

// Public
router.get("/", fetchOpportunities)
router.get("/:id", getOpportunity)

// Authenticated
router.post("/", authMiddleware, createOpportunities);

export default router;