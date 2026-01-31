/** @format */

import { socket } from "./socket.js";
// canvas setup
let canvas = document.getElementById("myCanvas");

canvas.width = window.innerWidth - 60;
canvas.height = window.innerHeight * 0.7;
let cursorCanvas = document.getElementById("cursorLayer");
cursorCanvas.width = window.innerWidth - 60;
cursorCanvas.height = window.innerHeight * 0.7;
let cursorCtx = cursorCanvas.getContext("2d");
canvas.style.cursor = "url('public/pen.png') 0 32 , auto";
let isDrawing = false;
let toolArray = { pen: "PEN", eraser: "ERASER", rectangle: "RECTANGLE" };
let tool = toolArray.pen;
let pencolor = "black";
let otherCursors = {};
// get context
let ctx = canvas.getContext("2d");
ctx.fillStyle = "white";
ctx.fillRect(0, 0, canvas.width, canvas.height);

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
function mouseDownEventTrigger(event) {
  const { x, y } = getCanvasCoordinates(event);
  isDrawing = true;

  currentStroke = [];
  ctx.beginPath();
  if (tool === toolArray.eraser) {
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = 10;
  } else if (tool === toolArray.pen) {
    ctx.globalCompositeOperation = "source-over";
    ctx.lineWidth = 4;
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
      lineWidth: tool === toolArray.eraser ? 10 : 4,
      socketId: socket.id,
    });
  }

  let now = Date.now();
  if (now - lastEmit > 30) {
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
    lineWidth: tool === toolArray.eraser ? 10 : 4,
    points: currentStroke,
  };
  localStrokes.push(strokeData);
  socket.emit("canvas:mouse-up", strokeData);
}
function mouseLeaveEventTrigger(event) {
  isDrawing = false;
  ctx.beginPath();
}

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
}
document.getElementById("clearBtn").addEventListener("click", clearCanvas);

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
// redo function
function redoCanvas() {}
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
    ctx.lineWidth = 10;
  } else if (tool === toolArray.pen) {
    ctx.globalCompositeOperation = "source-over";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.strokeStyle = pencolor;
    ctx.moveTo(x, y);
  }
}

function drawCursors(data) {
  const { x, y, username, socketId } = data;
  otherCursors[socketId] = { x, y, username };
  cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
  Object.values(otherCursors).forEach((cursor) => {
    console.log(cursor);
    cursorCtx.beginPath();
    cursorCtx.arc(cursor.x, cursor.y, 5, 0, Math.PI * 2);
    cursorCtx.fillStyle = "red";
    cursorCtx.fill();
    cursorCtx.closePath();

    cursorCtx.font = "12px Arial";
    cursorCtx.fillStyle = "black";
    cursorCtx.fillText(cursor.username, cursor.x + 8, cursor.y - 8);
  });
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
export {
  reMouseDown,
  replayStroke,
  redrawRoomHistory,
  localStrokes,
  drawCursors,
  drawLiveCursors,
};
