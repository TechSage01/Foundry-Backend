import { Server as HTTPServer} from "http";
import { Server } from "socket.io";
import { AuthSocket, socketMiddleware } from "../middlewares/socketAuth.js";
import { registerRoomHandlers } from "./handlers/room.js";

let io: Server;

export const initSocketServer = (httpServer: HTTPServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true
    }
  })

  io.use(socketMiddleware)

  io.on("connection", (socket) => {
    const authSocket = socket as AuthSocket;
    console.log(`[SOCKET CONNECTED]`)

    // handlers
    registerRoomHandlers(authSocket)

    authSocket.on("disconnect", (reason) => {
      console.log(`[SOCKET DISCONNECTED] Reason: ${reason}`)
    })
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.io is not initialized!");
  }
  return io;
};