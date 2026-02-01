/** @format */

const rooms = new Map(); // roomId=> set(socketsId)
const users = new Map(); // set(socketId) => {username,roomId}
const roomHistory = new Map(); // roomId => {undoStack:[],redoStack:[]}

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

function cleanUpRoomIfEmpty(roomId) {
  if (rooms.has(roomId) && rooms.get(roomId).size === 0) {
    rooms.delete(roomId);
    roomHistory.delete(roomId);
  }
}
function removeUserFromRoom(socketId) {
  const userDetails = getUserFromUsers(socketId);
  if (!userDetails) return;
  const { roomId } = userDetails;
  if (rooms.has(roomId)) {
    const roomUser = rooms.get(roomId);
    if (roomUser) {
      rooms.get(roomId).delete(socketId);
    }
    console.log("removed rooms:", rooms);
  }
  cleanUpRoomIfEmpty(roomId);
}
function getRoomId(socketId) {
  if (users.has(socketId)) {
    const user = users.get(socketId);
    return user.roomId;
  }
}
function getUsersFromRoom(roomId) {
  if (!rooms.has(roomId)) {
    return;
  }
  const users = rooms.get(roomId);
  let result = [];
  for (let socketId of users) {
    const user = getUserFromUsers(socketId);
    result.push(user);
  }
  return result;
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
  if (!users.has(socketId)) {
    return [];
  }
  const userDetails = users.get(socketId);
  return userDetails;
}
function removeUserfromUsers(socketId) {
  if (users.has(socketId)) {
    users.delete(socketId);
  }
  console.log("Removed users:", users);
  return;
}

//roomHistory
function createRoomHistory(roomId) {
  if (!roomHistory.has(roomId)) {
    roomHistory.set(roomId, {
      undoStack: [],
      redoStack: [],
    });
  }
  return;
}

function addEventToRoomHistory(roomId, socketId, data) {
  createRoomHistory(roomId);
  const { tool, color, lineWidth, points } = data;
  let event = { socketId, tool, color, lineWidth, points };
  const history = roomHistory.get(roomId);
  history.undoStack.push(event);
  history.redoStack.length = 0;
  console.log(roomHistory);
}

function undoRoomHistory(roomId, socketId) {
  createRoomHistory(roomId);
  const history = roomHistory.get(roomId);
  if (history.undoStack.length === 0) {
    return history.undoStack;
  }
  // remove stroke by the User, who belongs to
  // const stack = history.undoStack;
  // for (let i = stack.length - 1; i >= 0; i--) {
  //   if (stack[i].socketId == socketId) {
  //     const [removed] = stack.splice(i, 1);
  //     history.redoStack.push(removed);
  //     break;
  //   }
  // }

  // remove stroke globally
  const action = history.undoStack.pop();
  history.redoStack.push(action);
  console.log("undo hit by:", socketId);
  return history.undoStack;
}

function redoRoomHistory(roomId, socketId) {
  createRoomHistory(roomId);
  const history = roomHistory.get(roomId);
  if (history.redoStack.length === 0) {
    return history.undoStack;
  }
  // redo stroke by the User,who belongs to
  // const redoStack = history.redoStack;
  // for (let i = redoStack.length - 1; i >= 0; i--) {
  //   if (redoStack[i].socketId === socketId) {
  //     const action = redoStack.splice(i, 1)[0];
  //     history.undoStack.push(action);
  //     break;
  //   }
  // }

  //redo strokes globally
  const action = history.redoStack.pop();
  history.undoStack.push(action);
  console.log("redo hit by:", socketId);
  return history.undoStack;
}

function getRoomHistory(roomId) {
  if (!roomHistory.has(roomId)) {
    return [];
  }
  return roomHistory.get(roomId).undoStack;
}
function clearRoomHistory(roomId) {
  createRoomHistory(roomId);
  if (roomHistory.has(roomId)) {
    const history = roomHistory.get(roomId);
    history.undoStack.length = 0;
    history.redoStack.length = 0;
    console.log("cleared room history");
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
  redoRoomHistory,
  getUserFromUsers,
  getRoomHistory,
  clearRoomHistory,
  getUsersFromRoom,
};
