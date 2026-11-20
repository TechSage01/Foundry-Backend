import { Router } from "express";
import passport from "../config/passport.js"
import { getMe, issueCallbackToken, logout, renewAccessToken, requestOtp, sendRedirect, signin, verifyOtp } from "../controllers/auth.js";
import { authMiddleware, requireRefreshToken } from "../middlewares/auth.js";
import { authLimiter } from "../middlewares/limiter.js";

const router = Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get("/github", passport.authenticate('github', { scope: ['user:email'], session: false}))
router.get("/me", authMiddleware, getMe)
router.get("/refresh", requireRefreshToken, renewAccessToken)

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

router.post("/request-otp", authLimiter, requestOtp)
router.post("/verify-otp", authLimiter, verifyOtp, sendRedirect)
router.post("/logout", authMiddleware, logout)

if (process.env.NODE_ENV !== "production") {
  router.post("/signin", signin, issueCallbackToken)
}

export default router;