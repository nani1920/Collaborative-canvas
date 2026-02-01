/** @format */
import {
  replayStroke,
  redrawRoomHistory,
  drawCursors,
  drawLiveCursors,
  updateCursorArray,
  clearCanvas,
  renderOnlineUsers,
  registerEmitters,
} from "./canvas.js";

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const username = urlParams.get("username");
const roomId = urlParams.get("room");

const roomDetails = {
  username: username,
  roomId: roomId,
};
const socket = io("https://collaborative-canvas-o37o.onrender.com");

// to register the events....
registerEmitters({
  emitMouseMove: (data) => {
    socket.emit("canvas:mouse-move", data);
  },
  emitCursorMove: (data) => {
    socket.emit("cursor:move", data);
  },
  emitCanvasMouseUp: (data) => {
    socket.emit("canvas:mouse-up", data);
  },
  emitCursorLeave: () => {
    socket.emit("cursor:leave");
  },
  emitCanvasClear: () => {
    socket.emit("canvas:clear");
  },
  emitCanvasUndo: () => {
    console.log("undo");
    socket.emit("canvas:undo");
  },
  emitCanvasRedo: () => {
    socket.emit("canvas:redo");
  },
});

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
