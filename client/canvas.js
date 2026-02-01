/** @format */

// canvas setup
let canvas = document.getElementById("myCanvas");
let cursorCanvas = document.getElementById("cursorLayer");
let ctx = canvas.getContext("2d");
let cursorCtx = cursorCanvas.getContext("2d");

canvas.style.cursor = "url('public/pen.png') 0 32 , auto";
let isDrawing = false;
let toolArray = { pen: "PEN", eraser: "ERASER", rectangle: "RECTANGLE" };
let tool = toolArray.pen;
let pencolor = "black";
let lineWidth = 5;
let otherCursors = {};
let isCursorInsideCanvas = false;

let emitters = {};
function registerEmitters(e) {
  emitters = e;
}
// get context
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
// mouse events functions
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
    emitters.emitMouseMove?.({
      x,
      y,
      tool,
      color: pencolor,
      lineWidth: lineWidth,
    });
  }

  let now = Date.now();
  if (isCursorInsideCanvas && now - lastEmit > 30) {
    // socket.emit("cursor:move", { x, y });
    emitters.emitCursorMove?.({ x, y });
    lastEmit = now;
  }
}

function mouseUpEventTrigger(event) {
  const { x, y } = getCanvasCoordinates(event);
  currentStroke.push({ x, y });
  isDrawing = false;
  ctx.beginPath();

  const strokeData = {
    tool,
    color: pencolor,
    lineWidth: lineWidth,
    points: currentStroke,
  };
  localStrokes.push(strokeData);
  emitters.emitCanvasMouseUp?.(strokeData);
}
function mouseLeaveEventTrigger(event) {
  isDrawing = false;
  isCursorInsideCanvas = false;
  ctx.beginPath();
  emitters.emitCursorLeave?.();
}

//
// canvas clear function
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  localStrokes.length = 0;
}

//
// undo function
function undoCanvas() {
  // for (let i = localStrokes.length - 1; i >= 0; i--) {
  //   if (localStrokes[i].socketId === socket.id) {
  //     localStrokes.splice(i, 1);
  //     break;
  //   }
  // }
  emitters.emitCanvasUndo?.();
}
//
// redo function
function redoCanvas() {
  emitters.emitCanvasRedo?.();
}
//
//set up tool buttons
function setTool(newTool) {
  tool = newTool;
  if (tool === toolArray.eraser) {
    canvas.style.cursor = "url('public/eraser.png') 0 32 , auto";
  } else if (tool === toolArray.pen) {
    canvas.style.cursor = "url('public/pen.png') 0 32 , auto";
  }
}

//
// set up color picker
function setColor(newColor) {
  pencolor = newColor;
}

// set lineWidth
function setLineWidth(newLineWidth) {
  lineWidth = newLineWidth;
  document.getElementById("lineWidthValue").textContent = newLineWidth;
}

function replayStroke(strokes) {
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
  "#E53935",
  "#D81B60",
  "#8E24AA",
  "#5E35B1",
  "#3949AB",
  "#1E88E5",
  "#039BE5",
  "#00897B",
  "#43A047",
  "#7CB342",
  "#FDD835",
  "#FB8C00",
  "#F4511E",
  "#6D4C41",
  "#546E7A",
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
  "#8b5cf6",
];

const cursorColor = {};
function getCursorColor(socketId) {
  if (cursorColor[socketId]) return cursorColor[socketId];
  const randomIndex = Math.floor(Math.random() * color_pallete.length);
  const color = color_pallete[randomIndex];
  cursorColor[socketId] = color;
  return color;
}

let cursorImg;
let cursorImgLoaded = false;
function loadOnlineCursorImage() {
  cursorImg = new Image();
  cursorImg.src = "public/cursor.png";
  cursorImg.onload = () => {
    cursorImgLoaded = true;
  };
}
loadOnlineCursorImage();

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
    const iconCont = document.createElement("div");
    const spanItem = document.createElement("span");

    li.classList.add("userCard");
    spanItem.classList.add("username");
    iconCont.style.background =
      color_pallete[Math.floor(Math.random() * color_pallete.length)];
    iconCont.classList.add("icon-cont");
    iconCont.textContent = user.username[0].toUpperCase();
    spanItem.textContent = user.username.toUpperCase();
    li.appendChild(iconCont);
    li.appendChild(spanItem);
    userListEl.appendChild(li);
  });
}

//
//canvas event listeners
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

document.getElementById("clearBtn").addEventListener("click", () => {
  emitters.emitCanvasClear?.();
  clearCanvas();
});
document.getElementById("undoBtn").addEventListener("click", undoCanvas);
document.getElementById("redoBtn").addEventListener("click", redoCanvas);

document.getElementById("penBtn").addEventListener("click", () => {
  setTool(toolArray.pen);
});
document.getElementById("eraserBtn").addEventListener("click", () => {
  setTool(toolArray.eraser);
});
document.getElementById("colorPicker").addEventListener("input", (event) => {
  setColor(event.target.value);
});
document.getElementById("lineWidth").addEventListener("input", (event) => {
  setLineWidth(event.target.value);
});
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
  registerEmitters,
};
