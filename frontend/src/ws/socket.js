import { io } from "socket.io-client";
import { getToken } from "../api/client.js";

const WS_URL = import.meta.env.VITE_WS_URL || "http://localhost:4000/ws";

export function createSocket() {
  const token = getToken();
  return io(WS_URL, {
    auth: { token }
  });
}
