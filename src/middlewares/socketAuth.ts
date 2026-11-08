import { Socket } from "socket.io";
import { parseCookie } from "cookie"
import { verifyToken } from "../utils/jwt.js";

export interface AuthSocket extends Socket { data: { user: { id: string } } };

export const socketMiddleware = (socket: Socket, next: (err?: Error) => void) => {
  const rawCookieHeader = socket.handshake.headers.cookie;

  if (!rawCookieHeader) {
    return next(new Error("UNAUTHORIZED ACCESS"))
  }
  console.log("raw cookie header: ", rawCookieHeader)

  const cookies = parseCookie(rawCookieHeader);
  const token = cookies.foundry_token;

  if (!token) {
    return next(new Error("UNAUTHORIZED ACCESS"))
  }

  try {
    const decoded = verifyToken(token) as { id: string };

    if (!decoded) {
      return next(new Error("UNAUTHORIZED ACCESS"))
    }

    socket.data.user = { id: decoded.id };
    return next()
  } catch (error) {
    return next(new Error("UNAUTHORIZED ACCESS"))
  }
}