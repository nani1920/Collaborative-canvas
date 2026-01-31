/** @format */
import {
  // reDraw,
  // reMouseDown,
  // reMouseUp,
  replayStroke,
  redrawRoomHistory,
  localStrokes,
  drawCursors,
  drawLiveCursors,
} from "./canvas.js";

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const username = urlParams.get("username");
const roomId = urlParams.get("room");

const roomDetails = {
  username: username,
  roomId: roomId,
};
const socket = io("http://localhost:3000");

socket.on("connect", () => {
  console.log("connected");
  socket.emit("join-room", roomDetails);
});

socket.on("canvas:receive-mouse-down", (data) => {
  const { x, y, tool, startX, startY } = data;
  // reMouseDown(x, y, tool, startX, startY);
});
socket.on("canvas:receive-mouse-move", (data) => {
  drawLiveCursors(data);
});
socket.on("canvas:receive-mouse-up", (data) => {
  // localStrokes.push(data);
  replayStroke(data);
});

socket.on("canvas:recieve-undo", (events) => {
  // localStrokes = events;
  redrawRoomHistory(events);
});

socket.on("cursor:update", (data) => {
  drawCursors(data);
});

export { socket };
