import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { createMessage } from "../controllers/conversation.js";
import { uploadLimiter } from "../middlewares/limiter.js";
import { upload } from "../middlewares/upload.js";

const router = Router();

router.post("/messages", 
  authMiddleware, 
  uploadLimiter,
  upload.array("files", 5),
  createMessage
)

export default router;