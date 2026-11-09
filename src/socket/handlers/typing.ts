import { Socket } from "socket.io";
import { AuthSocket } from "../../middlewares/socketAuth.js";
import { getRoomName } from "../utils.js";

export const registerTypingHandlers = (socket: Socket) => {
  const authSocket = socket as AuthSocket;
  const userId = authSocket.data.user.id;

  authSocket.on("typing:start", (conversationId: string) => {
    const roomName = getRoomName(conversationId);

    authSocket.to(roomName).emit("typing:display", {
      conversation_id: conversationId,
      user_id: userId,
      is_typing: true
    });
  });

  authSocket.on("typing:stop", (conversationId: string) => {
    const roomName = getRoomName(conversationId);

    authSocket.to(roomName).emit("typing:display", {
      conversation_id: conversationId,
      user_id: userId,
      is_typing: false
    })
  })
};