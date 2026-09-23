import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { updateProfile } from "../controllers/profile.js";
import { upload } from "../middlewares/upload.js";

const router = Router();

router.put("/", 
  authMiddleware, 
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "cover_image", maxCount: 1 }
  ]), 
  updateProfile
)

export default router;