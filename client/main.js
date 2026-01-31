/** @format */

const form = document.getElementById("form");
const userName = document.getElementById("userName");
const roomId = document.getElementById("roomId");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!userName.value || !roomId.value) {
    alert("Invalid UserName or RoomId");
  }
  console.log(userName.value, roomId.value);
  window.location.href = `canvas.html?username=${encodeURIComponent(userName.value)}&room=${encodeURIComponent(roomId.value)}`;
});
