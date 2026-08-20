const { io } = require("socket.io-client");
const readline = require("readline");

const socket = io("http://localhost:4000", { auth: { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZmU4ZWVlZC00MjJmLTRlNGEtYWI5Zi1lMWFhMDUzNDMxNzMiLCJ1c2VybmFtZSI6ImFsaWNlIiwiaWF0IjoxNzg3MTY3MTY5LCJleHAiOjE3ODc3NzE5Njl9.T6-xovS7eis1TcQ73RU_KmImNmCjn_978jEKWeOw6pw" } });
const roomId = "7b18572a-61b5-46ea-9adf-baccef8eb93d";

socket.on("connect", () => {
  console.log("connected:", socket.id);
  socket.emit("room:join", { roomId });
  console.log("Type a message and hit Enter to send:");
});

socket.on("message:new", (msg) => console.log(`[${msg.username}]: ${msg.content}`));
socket.on("presence:online", (data) => console.log("ONLINE:", data.username));
socket.on("presence:offline", (data) => console.log("OFFLINE:", data.username));
socket.on("typing:start", (data) => console.log(`${data.username} is typing...`));

const rl = readline.createInterface({ input: process.stdin });
rl.on("line", (line) => {
  if (line.trim()) {
    socket.emit("message:send", { roomId, content: line });
  }
});