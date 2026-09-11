import { Router } from "express";
import passport from "../config/passport.js"
import { getMe, issueCallbackToken } from "../controllers/auth.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get("/github", passport.authenticate('github', { scope: ['user:email'], session: false}))
router.get("/me", authMiddleware, getMe)

router.get("/google/callback", 
  passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL}/signin?error="Authentication Failed"`,
    session: false
  }),
  issueCallbackToken
);
router.get("/github/callback", 
  passport.authenticate('github', {
    failureRedirect: `${process.env.CLIENT_URL}/signin?error="Authentication Failed"`,
    session: false
  }),
  issueCallbackToken
)

export default router;