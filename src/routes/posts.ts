import { Router } from "express";
import { authMiddleware, optionalAuthMiddleware } from "../middlewares/auth.js";
import { createPost, createRepost, deletePost, deleteRepost, getMyDrafts, getMyPosts, getPost, getPublishedPosts, togglePostLike, updatePost } from "../controllers/posts.js";
import { upload } from "../middlewares/upload.js";
import { uploadLimiter } from "../middlewares/limiter.js";
import { createComment, fetchComments } from "../controllers/postComments.js";
import { createPostBookmark, deletePostBookmark, getMyBookmarks } from "../controllers/postBookmarks.js";

const router = Router();

// Authenticated
router.get("/me", authMiddleware, getMyPosts)
router.get("/me/drafts", authMiddleware, getMyDrafts)
router.get("/me/bookmarks", authMiddleware, getMyBookmarks)

// Public
router.get("/", optionalAuthMiddleware, getPublishedPosts)
router.get("/:slug", getPost)
router.get("/:id/comments", fetchComments)

// Authenticated
router.post("/", authMiddleware, uploadLimiter, upload.single("cover_image"), createPost)
router.put("/:id", authMiddleware, uploadLimiter, upload.single("cover_image"), updatePost)
router.delete("/:id", authMiddleware, deletePost)

// likes
router.post("/:id/likes", authMiddleware, togglePostLike)

// reposts
router.post("/:id/repost", authMiddleware, createRepost)
router.delete("/:id/repost", authMiddleware, deleteRepost)

// comments
router.post("/:id/comments", authMiddleware, createComment)

// bookmarks
router.post("/:id/bookmarks", authMiddleware, createPostBookmark)
router.delete("/:id/bookmarks", authMiddleware, deletePostBookmark)

export default router;