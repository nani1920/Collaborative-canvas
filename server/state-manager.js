/** @format */

const rooms = new Map();
const users = new Map();
const roomHistory = new Map();

//
//room functions.
function addUserToRoom(roomDetails, socketId) {
  const { roomId } = roomDetails;
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  rooms.get(roomId).add(socketId);
  console.log("Added User to Room:", rooms);
}
function removeUserFromRoom(socketId) {
  const userDetails = getUserFromUsers(socketId);
  const { roomId } = userDetails;
  if (rooms.has(roomId)) {
    const roomUser = rooms.get(roomId);
    if (roomUser) {
      rooms.get(roomId).delete(socketId);
    }

    console.log("removed rooms:", rooms);
  }
}
function getRoomId(socketId) {
  if (users.has(socketId)) {
    const user = users.get(socketId);
    return user.roomId;
  }
}

//
// user function
function addUserToUsers(roomDetails, socketId) {
  const { username, roomId } = roomDetails;
  if (!users.has(socketId)) {
    users.set(socketId, { username, roomId });
    // console.log(users);
    console.log("Added user to Users:", users);
  }
}
function getUserFromUsers(socketId) {
  if (users.has(socketId)) {
    const userDetails = users.get(socketId);
    return userDetails;
  }
}
function removeUserfromUsers(socketId) {
  if (users.has(socketId)) {
    users.delete(socketId);
  }
  console.log("Removed users:", users);
  return;
}

function createRoomHistory(roomId) {
  if (!roomHistory.has(roomId)) {
    roomHistory.set(roomId, []);
  }
  return;
}
//roomHistory
function addEventToRoomHistory(roomId, socketId, data) {
  createRoomHistory(roomId);
  const { tool, color, lineWidth, points } = data;
  let event = { socketId, tool, color, lineWidth, points };
  roomHistory.get(roomId).push(event);
  console.log(roomHistory);
}

function undoRoomHistory(roomId, socketId) {
  const events = roomHistory.get(roomId) || [];
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].socketId == socketId) {
      events.splice(i, 1);
      break;
    }
  }
  roomHistory.set(roomId, events);
  console.log("undo hit by:", socketId);
  return events;
}

function getRoomHistory(roomId) {
  if (roomHistory.has(roomId)) {
    return roomHistory.get(roomId);
  }
}
function clearRoomHistory(roomId) {
  if (roomHistory.has(roomId)) {
    roomHistory.set(roomId, []);
  }
}

module.exports = {
  addUserToRoom,
  removeUserFromRoom,
  addUserToUsers,
  removeUserfromUsers,
  getRoomId,
  addEventToRoomHistory,
  undoRoomHistory,
  getUserFromUsers,
};
