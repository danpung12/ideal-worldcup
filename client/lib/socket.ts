// client/lib/socket.ts
"use client";

import { io } from "socket.io-client";


export const socket = io("http://localhost:4000", {
    autoConnect: false, // 수동 실행

});

