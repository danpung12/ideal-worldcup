"use client";
import { useEffect, useState } from "react";
import { socket } from "../lib/socket";

export default function Page() {
  const [msg, setMsg] = useState(""); // 입력한 글자
  const [list, setList] = useState<string[]>([]); //채팅 목록 리스트
  const [room, setRoom] = useState(""); // 방 번호 저장
  const [isJoined, setIsJoined] = useState(false); // 입장 버튼 눌렀는지
  const [gameStatus, setGameStatus] = useState<
    "waiting" | "playing" | "finished"
  >("waiting");
  const [nowPair, setNowPair] = useState<
    { id: number; name: string; img: string }[]
  >([]);

  const [winner, setWinner] = useState<{ name: string; img: string } | null>(
    null
  );

  const [roundText, setRoundText] = useState("");

  useEffect(() => {
    // 소켓 연결
    if (!socket.connected) {
      socket.connect();
    }

    // 채팅이 오면? -> 채팅 리스트에 추가
    socket.on("chat_msg", (data) => {
      setList((prev) => [...prev, data.msg]);
    });

    // 게임 시작하면? -> 게임상태 변경
    socket.on("round_start", ({ pair, total }) => {
      setNowPair(pair);
      setGameStatus("playing");

      if (total === 2) {
        setRoundText("결승");
      } else {
        setRoundText(`${total}강`);
      }
    });

    // 게임 끝 (우승자 나옴)
    socket.on("game_over", (finalWinner) => {
      setWinner(finalWinner);
      setGameStatus("finished");
    });
  }, []);

  const send = () => {
    const data = { room: room, msg: msg };
    socket.emit("chat_msg", data);
    setMsg("");
  };

  const joinRoom = () => {
    if (room !== "") {
      socket.emit("join_room", room);
      setIsJoined(true);
    }
  };

  const startGame = () => {
    socket.emit("game_start", room);
  };

  const vote = (id: number) => {
    socket.emit("vote", { room, winnerId: id });
  };

  if (!isJoined) {
    // [입장 전] 로비
    return (
      <div>
        <input
          placeholder="방 번호"
          onChange={(e) => setRoom(e.target.value)}
        />
        <button onClick={joinRoom}> 입장 </button>
      </div>
    );
  }

  // [입장 후]
  return (
    <div>
      <h3>현재 방: {room}</h3>
      {gameStatus === "waiting" ? (
        <div>
          {/* 대기 중 */}

          <button onClick={startGame}>게임 시작</button>
        </div>
      ) : (
        // 게임 시작
        <div>
          {gameStatus === "playing" && (
            <div>
              {roundText}
              <div className="flex">
                <div onClick={() => vote(nowPair[0]?.id)}>
                  <img src={nowPair[0]?.img} />
                </div>
                vs
                <div onClick={() => vote(nowPair[1]?.id)}>
                  <img src={nowPair[1]?.img} />
                </div>
              </div>
            </div>
          )}

          {gameStatus === "finished" && (
            <div>
              우승!
              <img src={winner?.img} />
              <p>{winner?.name}.</p>
            </div>
          )}

          {list.map((m, i) => (
            <div key={i}>{m}</div>
          ))}
          <input value={msg} onChange={(e) => setMsg(e.target.value)} />
          <button onClick={send}>전송</button>
        </div>
      )}
      ;
    </div>
  );
}
