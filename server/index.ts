import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const CANDIDATES = [
  {
    id: 1,
    name: "카리나",
    img: "https://placehold.co/400x400/FFB6C1/white?text=Karina",
  },
  {
    id: 2,
    name: "윈터",
    img: "https://placehold.co/400x400/87CEEB/white?text=Winter",
  },
  {
    id: 3,
    name: "하니",
    img: "https://placehold.co/400x400/98FB98/white?text=Hanni",
  },
  {
    id: 4,
    name: "민지",
    img: "https://placehold.co/400x400/DDA0DD/white?text=Minji",
  },
];

const roomStates: any = {};

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
  })
);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  // 연결 시
  console.log("접속:", socket.id); // 접속:id 띄워 줌

  socket.on("join_room", (roomName) => {
    // 방 입장
    socket.join(roomName);
    console.log(`유저 (${socket.id})가 [${roomName}] 방에 입장함!`);
  });

  socket.on("chat_msg", (data) => {
    // 메세지 전송
    io.to(data.room).emit("chat_msg", data); // data에서 room 뽑아 방 사람에게 전송
  });

  socket.on("game_start", (roomName) => {
    console.log(`${roomName} 게임 시작!!`);

    roomStates[roomName] = {
      candidates: [...CANDIDATES],
      winners: [],
      nowIdx: 0,
    };

    const round1 = [CANDIDATES[0], CANDIDATES[1]];
    io.to(roomName).emit("round_start", round1);
  });

  socket.on("vote", ({ room, winnerId }) => {
    const game = roomStates[room];

    const winner = game.candidates.find((c: any) => c.id == winnerId);

    game.winners.push(winner);
    game.nowIdx += 2;

    // 라운드 종료 체크 (현재 인덱스가 전체 길이와 같으면)
    if (game.nowIdx >= game.candidates.length) {
      // 승리자가 한명이라면? (우승)
      if (game.winners.length == 1) {
        console.log(`우승은 ${game.winners} 입니다.`);
        return io.to(room).emit("game_over", game.winners[0]);
      }

      // 진출자로 후보 목록을 교체
      game.candidates = game.winners;
      game.winners = [];
      game.nowIdx = 0;
    }
    // 다음 대결 안내
    io.to(room).emit(
      "round_start",
      game.candidates.slice(game.nowIdx, game.nowIdx + 2)
    );
  });

  socket.on("disconnect", () => console.log("나감:", socket.id));
});

server.listen(4000, () => console.log("서버 켜짐: 4000"));
