import { Router } from "express";
import passport from "../config/passport.js"
import { googleCallback } from "../controllers/auth.js";

const router = Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get("/google/callback", 
  passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL}`,
    session: false
  }),
  googleCallback
);

export default router;