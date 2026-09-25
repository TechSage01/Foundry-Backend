import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { createOpportunities } from "../controllers/opportunities.js";

const router = Router();

// Authenticated
router.post("/", authMiddleware, createOpportunities);

export default router;