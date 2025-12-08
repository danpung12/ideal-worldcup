"use client";
import { useEffect, useState, useRef } from "react";
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
  const [nickname, setNickname] = useState("");

  const chatEndRoll = useRef<HTMLDivElement>(null);

  const containerStyle =
    "min-h-screen bg-gray-100 flex items-center justify-center p-4";
  const cardStyle =
    "bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden p-6 md:p-10";
  const inputStyle =
    "w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition";
  const btnStyle =
    "w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition shadow-md";
  const gameImgContainerStyle =
    "relative w-full aspect-square md:aspect-[3/4] cursor-pointer group overflow-hidden rounded-xl shadow-lg border-4 border-transparent hover:border-indigo-500 transition-all duration-300";

  useEffect(() => {
    // 소켓 연결
    if (!socket.connected) {
      socket.connect();
    }

    // 채팅이 오면? -> 채팅 리스트에 추가
    socket.on("chat_msg", (data) => {
      setList((prev) => [...prev, `${data.nickname}: ${data.msg}`]);
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

  useEffect(() => {
    chatEndRoll.current?.scrollIntoView({ behavior: "smooth" });
  }, [list]);

  const send = () => {
    const data = { room: room, msg: msg };
    socket.emit("chat_msg", data);

    setList((prev) => [...prev, `${nickname}: ${msg}`]);
    setMsg("");
  };

  const joinRoom = () => {
    if (room !== "" && nickname !== "") {
      socket.emit("join_room", room, nickname);
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
      <div className={containerStyle}>
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-black text-gray-800 mb-2">
              이상형 월드컵
            </h1>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              닉네임
            </label>
            <input
              placeholder="닉네임"
              onChange={(e) => setNickname(e.target.value)}
              className="border p-2 mr-2 block w-full mb-2"
            />
            <label className="block text-sm font-medium text-gray-700 mb-1">
              방 번호
            </label>
            <input
              placeholder="방 번호"
              onChange={(e) => setRoom(e.target.value)}
              className="border p-2 mr-2 block w-full mb-2"
            />
            <button onClick={joinRoom} className={btnStyle}>
              {" "}
              입장{" "}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // [입장 후]
  return (
    <div className="p-5 text-center">
      <h3>🏠 현재 방: {room}</h3>
      {gameStatus === "waiting" ? (
        <div>
          {/* 대기 중 */}

          <button onClick={startGame} className="bg-red-500 text-white p-2">
            게임 시작
          </button>
        </div>
      ) : (
        // 게임 시작
        <div>
          {gameStatus === "playing" && (
            <div>
              {roundText}
              <div className="flex flex-row md:flex-row items-center justify-center ">
                <div
                  onClick={() => vote(nowPair[0]?.id)}
                  className="cursor-pointer border-4 border-blue-500 p-2"
                >
                  <img src={nowPair[0]?.img} width="200" height="200" />

                  <p className="text-black text-xl font-bold">
                    {nowPair[0]?.name}
                  </p>
                </div>

                <span className="self-center font-bold text-2xl">VS</span>

                <div
                  onClick={() => vote(nowPair[1]?.id)}
                  className="cursor-pointer border-4 border-red-500 p-2"
                >
                  <img src={nowPair[1]?.img} width="200" height="200" />
                  <p className="text-black text-xl font-bold">
                    {nowPair[1]?.name}
                  </p>
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
        </div>
      )}

      <div className="h-40 overflow-y-auto border mb-4">
        {list.map((m, i) => (
          <div key={i}>{m}</div>
        ))}
        <div ref={chatEndRoll} />
      </div>
      <div className="flex items-center justify-center ">
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          className="border p-2 mr-2"
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button
          onClick={send}
          className="bg-blue-500 text-white p-2 mr-2 flex-shrink:1"
        >
          전송
        </button>
      </div>
    </div>
  );
}
