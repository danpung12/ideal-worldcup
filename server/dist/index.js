import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
const CANDIDATES = [
    { id: 1, name: "카리나 (aespa)", img: "/images/카리나.jpg" },
    { id: 2, name: "장원영 (IVE)", img: "/images/장원영.jpg" },
    { id: 3, name: "민지 (뉴진스)", img: "/images/민지.jpg" },
    { id: 4, name: "안유진 (IVE)", img: "/images/안유진.jpg" },
];
const roomStates = {};
const app = express();
app.use(cors({
    origin: "*",
    methods: ["GET", "POST"],
}));
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
    socket.on("join_room", (roomName, nickname) => {
        // 방 입장
        socket.join(roomName);
        socket.data.nickname = nickname;
        socket.data.room = roomName;
        if (!roomStates[roomName]) {
            roomStates[roomName] = {
                users: [],
            };
        }
        console.log(`유저 (${socket.id})가 [${roomName}] 방에 입장함!`);
        socket.data.nickname = nickname;
        roomStates[roomName].users.push({ id: socket.id, nickname: nickname });
        io.to(roomName).emit("user_list", roomStates[roomName].users);
        io.to(roomName).emit("chat_msg", {
            nickname: "📢 시스템",
            msg: `${nickname}님이 입장하셨습니다!`,
        });
    });
    // [메세지 전송]
    socket.on("chat_msg", (data) => {
        socket.to(data.room).emit("chat_msg", {
            nickname: socket.data.nickname,
            msg: data.msg,
        }); // data에서 room 뽑아 방 사람에게 전송
    });
    // [게임 시작]
    socket.on("game_start", (roomName) => {
        console.log(`${roomName} 게임 시작!!`);
        roomStates[roomName] = {
            users: [],
            candidates: [...CANDIDATES],
            winners: [],
            nowIdx: 0,
            vote: {},
            voteUser: [],
            timer: null
        };
        const round1 = [CANDIDATES[0], CANDIDATES[1]];
        io.to(roomName).emit("round_start", {
            pair: round1,
            total: CANDIDATES.length,
        });
    });
    socket.on("vote", ({ room, winnerId }) => {
        const game = roomStates[room];
        const winner = game.candidates.find((c) => c.id == winnerId);
        game.winners.push(winner);
        game.nowIdx += 2;
        if (game.voteUser.include(socket.id)) {
            game.voteUser.push(socket.id);
        }
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
        io.to(room).emit("round_start", {
            pair: game.candidates.slice(game.nowIdx, game.nowIdx + 2),
            total: game.candidates.length,
        });
    });
    socket.on("disconnect", () => {
        const room = socket.data.room;
        roomStates[room].users = roomStates[room].users.filter((user) => user.id !== socket.id);
        io.to(room).emit("user_list", roomStates[room].users);
    });
});
server.listen(4000, () => console.log("서버 켜짐: 4000"));
console.log("🔥🔥🔥 [버전 확인] CORS 만능키(*) 적용된 서버 켜짐! 🔥🔥🔥");
