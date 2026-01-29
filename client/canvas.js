/** @format */

// canvas setup
let canvas = document.getElementById("myCanvas");
canvas.width = window.innerWidth - 60;
canvas.height = window.innerHeight * 0.7;
canvas.style.cursor = "url('public/pen.png') 0 32 , auto";
let isDrawing = false;
let restore_array = [];
let index = -1;
let tool_size = 2;
let toolArray = { pen: "PEN", eraser: "ERASER", rectangle: "RECTANGLE" };
let tool = toolArray.pen;
let pencolor = "black";
let startX = 0;
let startY = 0;

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

let savedImageData;
// mouse events
canvas.addEventListener("mousedown", (event) => {
  const { x, y } = getCanvasCoordinates(event);
  isDrawing = true;
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
  } else {
    ctx.globalCompositeOperation = "source-over";
    savedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    startX = x;
    startY = y;
  }
});

canvas.addEventListener("mousemove", (event) => {
  const { x, y } = getCanvasCoordinates(event);
  if (isDrawing) {
    if (tool === toolArray.pen || tool === toolArray.eraser) {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (tool === toolArray.rectangle) {
      if (index >= 0) {
        ctx.putImageData(savedImageData, 0, 0);
      } else {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.beginPath();
      ctx.strokeStyle = pencolor;
      ctx.lineWidth = 4;
      ctx.rect(startX, startY, x - startX, y - startY);
      ctx.stroke();
    }
  }
});

canvas.addEventListener("mouseup", (event) => {
  const { x, y } = getCanvasCoordinates(event);
  isDrawing = false;
  ctx.beginPath();
  if (tool !== toolArray.pen && tool !== toolArray.eraser) {
    ctx.strokeStyle = pencolor;
    ctx.lineWidth = 4;
    ctx.rect(startX, startY, x - startX, y - startY);
    ctx.stroke();
    ctx.closePath();
  }
  restore_array.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  index += 1;
});

canvas.addEventListener("mouseleave", (event) => {
  isDrawing = false;
  ctx.beginPath();
});

//
// canvas clear function
function clearCanvas() {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
// document.getElementById("clearBtn").addEventListener("click", clearCanvas);

//
// undo function
function undoCanvas() {
  if (index <= 0) {
    restore_array = [];
    index = -1;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    index -= 1;
    ctx.putImageData(restore_array[index], 0, 0);
  }
}

// redo function
function redoCanvas() {
  if (index < restore_array.length - 1) {
    index += 1;
    ctx.putImageData(restore_array[index], 0, 0);
  }
}

//
//set up tool buttons
function setTool(newTool) {
  tool = newTool;
  if (tool === toolArray.eraser) {
    canvas.style.cursor = "url('public/eraser.png') 0 32 , auto";
  } else if (tool === toolArray.pen) {
    canvas.style.cursor = "url('public/pen.png') 0 32 , auto";
    console.log(canvas.style.cursor);
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
