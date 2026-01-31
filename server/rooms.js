/** @format */

const { Server } = require("socket.io");

let io;
function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Connection established ", socket.id);
    socket.on("send-message", (msg) => {
      console.log(msg);
    });
    socket.on("canvas:mouse-down", (data) => {
      socket.emit("canvas:receive-mouse-down", data);
    });
    socket.on("canvas:mouse-move", (data) => {
      socket.broadcast.emit("canvas:receive-mouse-move", data);
    });
    socket.on("disconnect", () => {
      console.log("Connection closed", socket.id);
    });
  });
}

module.exports = { initSocket };
