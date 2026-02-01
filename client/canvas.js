/** @format */

import { socket } from "./socket.js";
// canvas setup
let canvas = document.getElementById("myCanvas");
let cursorCanvas = document.getElementById("cursorLayer");
let ctx = canvas.getContext("2d");
let cursorCtx = cursorCanvas.getContext("2d");

// canvas.width = window.innerWidth - 60;
// canvas.height = window.innerHeight * 0.7;
// cursorCanvas.width = window.innerWidth - 60;
// cursorCanvas.height = window.innerHeight * 0.7;
canvas.style.cursor = "url('public/pen.png') 0 32 , auto";
let isDrawing = false;
let toolArray = { pen: "PEN", eraser: "ERASER", rectangle: "RECTANGLE" };
let tool = toolArray.pen;
let pencolor = "black";
let lineWidth = 5;
let otherCursors = {};
let isCursorInsideCanvas = false;
// get context
ctx.fillStyle = "white";
ctx.fillRect(0, 0, canvas.width, canvas.height);

function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;

  cursorCanvas.width = rect.width;
  cursorCanvas.height = rect.height;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);
// get canvas coordinates
function getCanvasCoordinates(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

let currentStroke = [];
let localStrokes = [];
// mouse events
function mouseEnterEventTrigger(event) {
  isCursorInsideCanvas = true;
}
function mouseDownEventTrigger(event) {
  const { x, y } = getCanvasCoordinates(event);
  isDrawing = true;
  currentStroke = [];
  ctx.beginPath();
  if (tool === toolArray.eraser) {
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = lineWidth;
  } else if (tool === toolArray.pen) {
    ctx.globalCompositeOperation = "source-over";
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.strokeStyle = pencolor;
    ctx.moveTo(x, y);
  }
}
let lastEmit = 0;
function mouseMoveEventTrigger(event) {
  const { x, y } = getCanvasCoordinates(event);
  if (isDrawing) {
    currentStroke.push({ x, y });
    if (tool === toolArray.pen || tool === toolArray.eraser) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    socket.emit("canvas:mouse-move", {
      x,
      y,
      tool,
      color: pencolor,
      lineWidth: lineWidth,
      socketId: socket.id,
    });
  }

  let now = Date.now();
  if (isCursorInsideCanvas && now - lastEmit > 30) {
    socket.emit("cursor:move", { x, y });
    lastEmit = now;
  }
}

function mouseUpEventTrigger(event) {
  const { x, y } = getCanvasCoordinates(event);
  currentStroke.push({ x, y });
  isDrawing = false;
  ctx.beginPath();

  const strokeData = {
    socketId: socket.id,
    tool,
    color: pencolor,
    lineWidth: lineWidth,
    points: currentStroke,
  };
  localStrokes.push(strokeData);
  socket.emit("canvas:mouse-up", strokeData);
}
function mouseLeaveEventTrigger(event) {
  isDrawing = false;
  isCursorInsideCanvas = false;
  ctx.beginPath();
  socket.emit("cursor:leave");
}

canvas.addEventListener("mouseenter", (event) => {
  mouseEnterEventTrigger(event);
});
canvas.addEventListener("mousedown", (event) => {
  mouseDownEventTrigger(event);
});
canvas.addEventListener("mousemove", (event) => {
  mouseMoveEventTrigger(event);
});
canvas.addEventListener("mouseup", (event) => {
  mouseUpEventTrigger(event);
});

canvas.addEventListener("mouseleave", (event) => {
  mouseLeaveEventTrigger(event);
});

//
// canvas clear function
function clearCanvas() {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  localStrokes.length = 0;
}
document.getElementById("clearBtn").addEventListener("click", () => {
  socket.emit("canvas:clear");
  clearCanvas();
});

//
// undo function
function undoCanvas() {
  for (let i = localStrokes.length - 1; i >= 0; i--) {
    if (localStrokes[i].socketId === socket.id) {
      localStrokes.splice(i, 1);
      break;
    }
  }
  socket.emit("canvas:undo");
}
document.getElementById("undoBtn").addEventListener("click", undoCanvas);

//
// redo function
function redoCanvas() {
  socket.emit("canvas:redo");
}
document.getElementById("redoBtn").addEventListener("click", redoCanvas);

//
//set up tool buttons
function setTool(newTool) {
  tool = newTool;
  if (tool === toolArray.eraser) {
    canvas.style.cursor = "url('public/eraser.png') 0 32 , auto";
  } else if (tool === toolArray.pen) {
    canvas.style.cursor = "url('public/pen.png') 0 32 , auto";
  } else if (tool === toolArray.rectangle) {
    canvas.style.cursor = "crosshair";
  }
}
document.getElementById("penBtn").addEventListener("click", () => {
  setTool(toolArray.pen);
});
document.getElementById("eraserBtn").addEventListener("click", () => {
  setTool(toolArray.eraser);
});
document.getElementById("rectangleBtn").addEventListener("click", () => {
  setTool(toolArray.rectangle);
});

//
// set up color picker
function setColor(newColor) {
  pencolor = newColor;
}
document.getElementById("colorPicker").addEventListener("change", (event) => {
  setColor(event.target.value);
});

// set lineWidth
function setLineWidth(newLineWidth) {
  lineWidth = newLineWidth;
  document.getElementById("lineWidthValue").textContent = newLineWidth;
}
document.getElementById("lineWidth").addEventListener("input", (event) => {
  setLineWidth(event.target.value);
});

function replayStroke(strokes) {
  console.log(strokes);

  const { tool, points, color, lineWidth, socketId } = strokes;
  if (tool == toolArray.pen || tool == toolArray.eraser) {
    ctx.beginPath();
    ctx.globalCompositeOperation =
      tool === toolArray.eraser ? "destination-out" : "source-over";
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.stroke();
    ctx.closePath();
  }
  remoteLastPoints[socketId] = null;
}
function redrawRoomHistory(history) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  history.forEach((stroke) => replayStroke(stroke));
}

function reMouseDown(x, y, tool) {
  ctx.beginPath();
  if (tool === toolArray.eraser) {
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = lineWidth;
  } else if (tool === toolArray.pen) {
    ctx.globalCompositeOperation = "source-over";
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.strokeStyle = pencolor;
    ctx.moveTo(x, y);
  }
}
const color_pallete = [
  "#E53935", // red
  "#D81B60", // pink
  "#8E24AA", // purple
  "#5E35B1", // deep purple
  "#3949AB", // indigo
  "#1E88E5", // blue
  "#039BE5", // light blue
  "#00897B", // teal
  "#43A047", // green
  "#7CB342", // light green
  "#FDD835", // yellow
  "#FB8C00", // orange
  "#F4511E", // deep orange
  "#6D4C41", // brown
  "#546E7A", // blue grey
];
const cursorColor = {};
function getCursorColor(socketId) {
  if (cursorColor[socketId]) return cursorColor[socketId];
  const randomIndex = Math.floor(Math.random() * color_pallete.length);
  const color = color_pallete[randomIndex];
  cursorColor[socketId] = color;
  return color;
}
let cursorImg = new Image();
let cursorImgLoaded = false;
cursorImg.src = "public/cursor.png";
cursorImg.onload = () => {
  cursorImgLoaded = true;
};

function redrawAllCursors() {
  cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
  Object.values(otherCursors).forEach((cursor) => {
    const color = getCursorColor(cursor.socketId);

    cursorCtx.beginPath();
    cursorCtx.drawImage(cursorImg, cursor.x - 10, cursor.y - 10, 25, 25);

    cursorCtx.font = "600 16px 'Segoe UI', system-ui, sans-serif";
    cursorCtx.fillStyle = color;
    cursorCtx.fillText(cursor.username, cursor.x + 8, cursor.y - 8);
  });
}
function drawCursors(data) {
  const { x, y, username, socketId } = data;
  otherCursors[socketId] = { x, y, username, socketId };
  redrawAllCursors();
}

function updateCursorArray(socketId) {
  delete otherCursors[socketId];
  console.log("otherCursors:", otherCursors);
  console.log("cursorColor:", cursorColor);
  redrawAllCursors();
}

let remoteLastPoints = {};
function drawLiveCursors(data) {
  const { x, y, tool, color, lineWidth, socketId } = data;
  console.log("socket", socketId);
  if (!remoteLastPoints[socketId]) {
    remoteLastPoints[socketId] = { x, y };
    return;
  }

  ctx.beginPath();

  ctx.globalCompositeOperation =
    tool === toolArray.eraser ? "destination-out" : "source-over";
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.moveTo(remoteLastPoints[socketId].x, remoteLastPoints[socketId].y);
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.closePath();
  remoteLastPoints[socketId] = { x, y };
}

function renderOnlineUsers(users) {
  const userListEl = document.getElementById("onlineUsers");
  userListEl.innerHTML = "";
  users.forEach((user) => {
    const li = document.createElement("li");
    li.textContent = user.username;
    console.log(li);
    userListEl.appendChild(li);
  });
}

export {
  reMouseDown,
  replayStroke,
  redrawRoomHistory,
  localStrokes,
  drawCursors,
  drawLiveCursors,
  updateCursorArray,
  clearCanvas,
  renderOnlineUsers,
};
