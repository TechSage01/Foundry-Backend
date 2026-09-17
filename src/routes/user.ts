import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { followUser, getFollowers, getFollowing, unFollowUser } from "../controllers/follow.js";

const router = Router();

// Public
router.get("/:username/followers", getFollowers)
router.get("/:username/following", getFollowing)

// Authenticated
router.post("/:id/follow", authMiddleware, followUser)
router.delete("/:id/follow", authMiddleware, unFollowUser)

export default router