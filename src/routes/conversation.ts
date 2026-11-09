import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { createConversation, createMessage, getConversations, getMessages, getPendingJoinRequests, joinConversation, markConversationsAsRead, reviewPendingRequets } from "../controllers/conversation.js";
import { uploadLimiter } from "../middlewares/limiter.js";
import { upload } from "../middlewares/upload.js";

const router = Router();

router.get("/", authMiddleware, getConversations)
router.get("/:id/messages", authMiddleware, getMessages)
router.get("/:id/requests", authMiddleware, getPendingJoinRequests)

router.post("/messages", 
  authMiddleware, 
  uploadLimiter,
  upload.array("files", 5),
  createMessage
);
router.post("/", 
  authMiddleware,
  uploadLimiter,
  upload.single("icon"),
  createConversation
);

router.patch("/:id/read", authMiddleware, markConversationsAsRead)
router.post("/join/:code", authMiddleware, joinConversation)
router.patch("/:id/requests/:applicantId", authMiddleware, reviewPendingRequets)

export default router;