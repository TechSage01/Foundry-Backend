import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { createOpportunity, deleteOpportunity, fetchOpportunities, getMyOpportunities, getOpportunity, updateOpportunity } from "../controllers/opportunities.js";
import { submitOpportunityApplications } from "../controllers/opportunityApplications.js";

const router = Router();

router.get("/me", authMiddleware, getMyOpportunities)

// Public
router.get("/", fetchOpportunities)
router.get("/:id", getOpportunity)

// Authenticated
router.post("/", authMiddleware, createOpportunity);
router.put("/:id", authMiddleware, updateOpportunity)
router.delete("/:id", authMiddleware, deleteOpportunity)

router.post("/:id/apply", authMiddleware, submitOpportunityApplications)

export default router;