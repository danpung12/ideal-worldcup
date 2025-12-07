// client/lib/socket.ts
"use client";

import { io } from "socket.io-client";

const URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

export const socket = io(URL, {
  autoConnect: false, // 수동 실행
});
