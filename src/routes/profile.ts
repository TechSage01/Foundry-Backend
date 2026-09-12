import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { updateProfile } from "../controllers/profile.js";
import { upload } from "../middlewares/upload.js";

const router = Router();

router.put("/", authMiddleware, upload.single("avatar"), updateProfile)

export default router;