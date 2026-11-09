import http from "http";
import app from "./app.js";
import { initSocketServer } from "./socket/index.js";
import pool from "./config/db.js";

// REST API
const server = http.createServer(app);

// Websocket API
initSocketServer(server);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

    console.log("Connected to Database")

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
    })
  } catch (err) {
    console.error("Failed to connect to database: ", err)
    process.exit(1);
  }
}

startServer();

