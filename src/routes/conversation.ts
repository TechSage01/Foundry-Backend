import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { createMessage, getConversations, getMessages } from "../controllers/conversation.js";
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
router.get("/:id/messages", authMiddleware, getMessages)

export default router;