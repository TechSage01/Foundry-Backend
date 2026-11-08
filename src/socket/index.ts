import { Server as HTTPServer} from "http";
import { Server } from "socket.io";
import { AuthSocket, socketMiddleware } from "../middlewares/socketAuth.js";

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
    const userId = authSocket.data.user.id;

    console.log(`[SOCKET CONNECTED] User Id: ${userId}`)

    authSocket.on("ping", (payload) => {
      console.log("[Ping Received]")

      authSocket.emit("pong", {
        message: "pong",
        userId: userId
      })
    })

    authSocket.on("disconnect", (reason) => {
      console.log(`[SOCKET DISCONNECTED] Reason: ${reason}`)
    })
  });

  return io;
}