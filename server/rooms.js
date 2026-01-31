/** @format */

const { Server } = require("socket.io");
const {
  addUserToRoom,
  removeUserFromRoom,
  addUserToUsers,
  removeUserfromUsers,
  getRoomId,
  addEventToRoomHistory,
  undoRoomHistory,
  getUserFromUsers,
} = require("./state-manager.js");

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
    socket.on("join-room", (roomDetails) => {
      const { roomId } = roomDetails;
      socket.join(roomId);
      addUserToRoom(roomDetails, socket.id);
      addUserToUsers(roomDetails, socket.id);
    });
    socket.on("canvas:mouse-down", (data) => {
      socket.emit("canvas:receive-mouse-down", data);
    });
    socket.on("canvas:mouse-move", (data) => {
      const roomId = getRoomId(socket.id);
      socket.to(roomId).emit("canvas:receive-mouse-move", data);
    });
    socket.on("canvas:mouse-up", (data) => {
      const roomId = getRoomId(socket.id);

      addEventToRoomHistory(roomId, socket.id, data);
      socket.to(roomId).emit("canvas:receive-mouse-up", data);
    });
    socket.on("canvas:undo", () => {
      const roomId = getRoomId(socket.id);
      const events = undoRoomHistory(roomId, socket.id);
      io.to(roomId).emit("canvas:recieve-undo", events);
    });

    socket.on("cursor:move", (data) => {
      const roomId = getRoomId(socket.id);
      const { username } = getUserFromUsers(socket.id);
      socket.to(roomId).emit("cursor:update", {
        socketId: socket.id,
        x: data.x,
        y: data.y,
        username: username,
      });
    });

    socket.on("disconnect", () => {
      removeUserFromRoom(socket.id);
      removeUserfromUsers(socket.id);
      console.log("Connection closed", socket.id);
    });
  });
}

module.exports = { initSocket };
