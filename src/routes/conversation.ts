import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { createMessage, getConversations } from "../controllers/conversation.js";
import { uploadLimiter } from "../middlewares/limiter.js";
import { upload } from "../middlewares/upload.js";

const router = Router();

router.post("/messages", 
  authMiddleware, 
  uploadLimiter,
  upload.array("files", 5),
  createMessage
)

router.get("/", authMiddleware, getConversations)

export default router;