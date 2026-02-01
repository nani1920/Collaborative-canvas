/** @format */
import {
  replayStroke,
  redrawRoomHistory,
  localStrokes,
  drawCursors,
  drawLiveCursors,
  updateCursorArray,
  clearCanvas,
  renderOnlineUsers,
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

socket.on("canvas:sync-history", (history) => {
  redrawRoomHistory(history);
});

socket.on("room:online-users", (users) => {
  renderOnlineUsers(users);
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

socket.on("canvas:clear", () => {
  clearCanvas();
});
socket.on("canvas:recieve-undo", (events) => {
  // localStrokes = events;
  redrawRoomHistory(events);
});
socket.on("canvas:receive-redo", (events) => {
  // localStrokes = events;
  redrawRoomHistory(events);
});

socket.on("cursor:update", (data) => {
  drawCursors(data);
});
socket.on("cursor:update-leave", ({ socketId }) => {
  console.log("cursor=leave:", socketId);
  updateCursorArray(socketId);
});

export { socket };
