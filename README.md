# Inkspace

**A real-time collaborative whiteboard built with Socket.io**

Multiple users can draw, erase, and interact in the same digital space simultaneously.

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <repository-url>
cd Collaborative-Canvas/server
npm install
```

### 2. Start the Server

```bash
npm start
```

> Server runs at **http://localhost:3000**

### 3. Open the App

Open `client/index.html` in your browser, enter a username and room ID, and start drawing!

---

## ✨ Features

- **Real-time Sync** — See other users' drawings instantly
- **Room-based** — Private spaces with unique Room IDs
- **Drawing Tools** — Pen with customizable colors and eraser
- **Undo/Redo** — Global and per-user modes
- **Live Cursors** — See where others are pointing
- **Online Users** — View active participants

---

## 🛠️ Tech Stack

**Frontend:** HTML5 Canvas, Vanilla JavaScript, CSS3, Socket.io Client  
**Backend:** Node.js, Express, Socket.io

---

## 📂 Project Structure

```
Collaborative-Canvas/
├── client/
│   ├── index.html       # Join room page
│   ├── canvas.html      # Whiteboard
│   ├── canvas.js        # Drawing logic
│   ├── socket.js        # WebSocket handling
│   └── style.css
├── server/
│   ├── server.js        # Express + Socket.io
│   ├── rooms.js         # Event handlers
│   └── state-manager.js # State management
└── README.md
```

---

## 🧪 Testing with Multiple Users

### Option 1: Multiple Browser Tabs

1. Open `client/index.html` in **Tab 1**
2. Enter username: `UserA`, room: `test-room` → Click **Enter Room**
3. Open same URL in **Tab 2**
4. Enter username: `UserB`, room: `test-room` → Click **Enter Room**
5. Draw in Tab 1 — it appears instantly in Tab 2!

### Option 2: Different Devices

1. Find your IP: Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Start server on your machine
3. On another device, go to `http://<your-ip>:3000`
4. Join the same Room ID

### ✅ Test Checklist

| Test | Expected Result |
|------|-----------------|
| Draw a stroke | Appears on all connected clients |
| Move cursor | Labeled cursor visible to others |
| Click Undo | Last stroke removed for everyone |
| Click Redo | Stroke restored for everyone |
| Click Clear | Canvas cleared for everyone |
| Join different room | Isolated from other rooms |

---

## ⚠️ Known Limitations

| Limitation | Description |
|------------|-------------|
| No Persistence | History lost on server restart |
| No Authentication | Anyone with Room ID can join |
| Single Server | No horizontal scaling support |
| Fixed Canvas | No pan/zoom functionality |
| Desktop Only | No touch/mobile support |

---

## ⏱️ Time Spent

| Phase | Hours |
|-------|-------|
| Core Canvas + Drawing | 5 |
| Socket.io Integration | 3 |
| Room Management | 4 |
| Undo/Redo Logic | 3 |
| Live Cursors | 3 |
| UI & Styling | 4 |
| Testing & Debugging | 4 |
| **Total** | **26** |

---

## 📄 License

ISC
