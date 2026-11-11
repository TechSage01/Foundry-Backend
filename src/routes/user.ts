import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { followUser, getFollowers, getFollowing, unFollowUser } from "../controllers/follow.js";
import { fetchUsers, getUserProfile } from "../controllers/profile.js";

const router = Router();

// Public
router.get("/:username", getUserProfile)
router.get("/:username/followers", getFollowers)
router.get("/:username/following", getFollowing)

// Authenticated
router.get("/", authMiddleware, fetchUsers)
router.post("/:username/follow", authMiddleware, followUser)
router.delete("/:username/follow", authMiddleware, unFollowUser)

export default router