import { Router } from "express";

const router = Router();

router.post("/")
router.get("/")
router.get("/:slug")
router.get("/user/:username")
router.put("/:id")
router.delete("/:id")

export default router;