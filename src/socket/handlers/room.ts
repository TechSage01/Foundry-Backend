import { Socket } from "socket.io";
import { AuthSocket } from "../../middlewares/socketAuth.js";
import pool from "../../config/db.js";

export const registerRoomHandlers = (socket: Socket) => {
  const authSocket = socket as AuthSocket;
  const userId = authSocket.data.user.id;

  authSocket.on("conversation:join", async (conversationId: string) => {
    try {
      const { rows } = await pool.query(`
        SELECT role FROM conversation_members
        WHERE conversation_id = $1 AND user_id = $2 AND status = 'active'
      `, [conversationId, userId])

      if (rows.length === 0) {
        authSocket.emit("error", {
          event: "conversation:join",
          message: "FORBIDDEN: You are not a active member of this conversation"
        });
        return
      }

      const roomName = `conversation:${conversationId}`;
      authSocket.join(roomName);

      authSocket.emit("conversation:joined", { conversation_id: conversationId })
      console.log(`[SOCKET] User: ${userId} joined room ${roomName}`)
    } catch (error) {
      console.error(`[SOCKET ERROR] conversation:join: `, error)
      authSocket.emit("error", {
        event: "conversation:join",
        message: "Failed to join room"
      })
    }
  });

  authSocket.on("conversation:leave", (conversationId: string) => {
    const roomName = `conversation:${conversationId}`;
    authSocket.leave(roomName);
    console.log(`[SOCKET] User: ${userId} left room ${roomName}`)
  });
}