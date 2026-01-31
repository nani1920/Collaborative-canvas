/** @format */
import { reDraw } from "./canvas.js";

const socket = io("http://localhost:3000");
socket.on("connect", () => {
  console.log("connected");
  socket.emit("send-message", { message: "Hello from client" });
});

socket.on("receive-msg", (msg) => {
  console.log(msg);
});
socket.on("canvas:receive-mouse-down", (data) => {
  console.log("Remote mouse down:", data);
});
socket.on("canvas:receive-mouse-move", (data) => {
  const { x, y, tool } = data;
  console.log(data);
  reDraw(x, y, tool);
});

export { socket };
