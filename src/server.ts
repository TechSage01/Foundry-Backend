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
import pool from "./config/db.js";

dotenv.config();
const app = express();

// middlewares
app.use((req, res, next) => {
  cors({
    origin: [process.env.CLIENT_URL!],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })(req, res, next)
})
app.use(express.json())
app.use(cookieParser())
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize());
app.use(passport.session());

// routes
app.use("/", appRouter)
app.use("/api/auth", authRouter)
app.use("/api/profile", profileRouter)
app.use("/api/projects", projectRouter)

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

    console.log("Connected to PostgreSQL")

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
    })
  } catch (err) {
    console.error("Failed to connect to database: ", err)
    process.exit(1);
  }
}

startServer();

