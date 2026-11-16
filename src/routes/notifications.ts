import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { getNotifications, markNotification } from "../controllers/notifications.js";

const router = Router();

router.get("/", authMiddleware, getNotifications)
router.patch("/:id", authMiddleware, markNotification)

export default router;