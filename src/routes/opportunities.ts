import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { createOpportunities, fetchOpportunities } from "../controllers/opportunities.js";

const router = Router();

// Public
router.get("/", fetchOpportunities)

// Authenticated
router.post("/", authMiddleware, createOpportunities);

export default router;