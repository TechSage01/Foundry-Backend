import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "./config/passport.js";
import appRouter from "./routes/app.js";
import authRouter from "./routes/auth.js"
import profileRouter from "./routes/profile.js"
import projectRouter from "./routes/projects.js"
import experienceRouter from "./routes/experience.js"
import postRouter from "./routes/posts.js"
import userRouter from "./routes/user.js"
import pool from "./config/db.js";
import logger from "./middlewares/logger.js";
import { globalLimiter, uploadLimiter } from "./middlewares/limiter.js";

dotenv.config();
const app = express();

// middlewares
app.set("trust proxy", 1)
app.use((req, res, next) => {
  cors({
    origin: [process.env.CLIENT_URL!],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })(req, res, next)
})
app.use(express.json())
app.use(cookieParser())
app.use(logger)
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize());
app.use(passport.session());


// routes
app.use("/", globalLimiter, appRouter)
app.use("/api/auth", authRouter)
app.use("/api/profile", uploadLimiter, profileRouter)
app.use("/api/projects", projectRouter)
app.use("/api/experiences", experienceRouter)
app.use("/api/posts", postRouter)
app.use("/api/users", userRouter)


const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

    console.log("Connected to Database")

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
    })
  } catch (err) {
    console.error("Failed to connect to database: ", err)
    process.exit(1);
  }
}

startServer();

