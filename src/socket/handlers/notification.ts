import { Socket } from "socket.io";
import { AuthSocket } from "../../middlewares/socketAuth.js";
import pool from "../../config/db.js";

export const registerNotificationHandler = (socket: Socket) => {
  const authSocket = socket as AuthSocket;
  const userId = authSocket.data.user.id;

  authSocket.on("notification:read", async (notificationId: string) => {
    try {
      if (notificationId) {
        await pool.query(`
          UPDATE notifications
          SET is_read = true
          WHERE id = $1
            AND recipent_id = $2
            AND is_read = false
        `, [notificationId, userId])
      }
    } catch (error) {
      console.error("[SOCKET ERROR] notification read")
    }
  })
}