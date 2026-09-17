import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { followUser, unFollowUser } from "../controllers/follow.js";

const router = Router();

router.post("/:id/follow", authMiddleware, followUser)
router.delete("/:id/follow", authMiddleware, unFollowUser)


export default router