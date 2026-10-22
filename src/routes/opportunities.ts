import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { createOpportunity, deleteOpportunity, fetchOpportunities, getMyOpportunities, getOpportunity, updateOpportunity } from "../controllers/opportunities.js";
import { fetchMyApplications, fetchOpportunityApplications, submitOpportunityApplications } from "../controllers/opportunityApplications.js";

const router = Router();

router.get("/me", authMiddleware, getMyOpportunities)
router.get("/me/applications", authMiddleware, fetchMyApplications)

// Public
router.get("/", fetchOpportunities)
router.get("/:id", getOpportunity)

// Authenticated
router.post("/", authMiddleware, createOpportunity);
router.put("/:id", authMiddleware, updateOpportunity)
router.delete("/:id", authMiddleware, deleteOpportunity)

router.post("/:id/apply", authMiddleware, submitOpportunityApplications)
router.get("/:id/applications", authMiddleware, fetchOpportunityApplications)

export default router;