# Architecture

> Technical documentation for Inkspace - a real-time collaborative whiteboard.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INKSPACE ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────┐         WebSocket          ┌──────────────────────────┐  │
│   │   Client A   │ ◄─────────────────────────►│                          │  │
│   │  (Browser)   │                            │     Node.js Server       │  │
│   └──────────────┘                            │                          │  │
│                              Room: "abc123"   │  ┌────────────────────┐  │  │
│   ┌──────────────┐                            │  │   State Manager    │  │  │
│   │   Client B   │ ◄─────────────────────────►│  │  • rooms (Map)     │  │  │
│   │  (Browser)   │                            │  │  • users (Map)     │  │  │
│   └──────────────┘                            │  │  • history (Map)   │  │  │
│                                               │  └────────────────────┘  │  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### Drawing Event Flow

```
User Action                    Client                         Server                        Other Clients
    │                            │                              │                               │
    │  Mouse Down                │                              │                               │
    ├──────────────────────────► │                              │                               │
    │                            │  ctx.beginPath()             │                               │
    │                            │  (Local render starts)       │                               │
    │                            │                              │                               │
    │  Mouse Move (drawing)      │                              │                               │
    ├──────────────────────────► │                              │                               │
    │                            │  ctx.lineTo() (Local)        │                               │
    │                            ├─────────────────────────────►│  "canvas:mouse-move"          │
    │                            │                              ├──────────────────────────────►│
    │                            │                              │                               │  drawLiveCursors()
    │                            │                              │                               │
    │  Mouse Up                  │                              │                               │
    ├──────────────────────────► │                              │                               │
    │                            │  Complete stroke locally     │                               │
    │                            ├─────────────────────────────►│  "canvas:mouse-up"            │
    │                            │                              │  addEventToRoomHistory()      │
    │                            │                              ├──────────────────────────────►│
    │                            │                              │                               │  replayStroke()
```

---

## WebSocket Protocol

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `join-room` | `{username, roomId}` | User joins a room |
| `canvas:mouse-move` | `{x, y, tool, color, lineWidth}` | Real-time drawing coordinates |
| `canvas:mouse-up` | `{tool, color, lineWidth, points[]}` | Completed stroke data |
| `canvas:clear` | - | Clear canvas request |
| `canvas:undo` | - | Undo last stroke |
| `canvas:redo` | - | Redo last undone stroke |
| `cursor:move` | `{x, y}` | Cursor position update |
| `cursor:leave` | - | User cursor left canvas |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `canvas:sync-history` | `stroke[]` | Full canvas history on join |
| `canvas:receive-mouse-move` | `{socketId, x, y, tool, color, lineWidth}` | Broadcast drawing to others |
| `canvas:receive-mouse-up` | `{socketId, ...strokeData}` | Broadcast completed stroke |
| `canvas:clear` | - | Broadcast clear command |
| `canvas:recieve-undo` | `stroke[]` | Updated history after undo |
| `canvas:receive-redo` | `stroke[]` | Updated history after redo |
| `room:online-users` | `user[]` | Updated user list |
| `cursor:update` | `{socketId, x, y, username}` | Other user's cursor position |
| `cursor:update-leave` | `{socketId}` | User cursor left |

---

## Undo/Redo Strategy

### Data Structure

```javascript
roomHistory = Map<roomId, {
  undoStack: stroke[],  // All visible strokes
  redoStack: stroke[]   // Undone strokes (restorable)
}>
```

### Global Undo (Active)

```
Before Undo:
  undoStack: [A, B, C]
  redoStack: []

After Undo:
  undoStack: [A, B]
  redoStack: [C]
```

**Behavior**: Any user can undo the last stroke, regardless of who drew it. The entire room sees the change.

### Self Undo (Available, Commented)

```javascript
// In state-manager.js (lines 108-115)
for (let i = stack.length - 1; i >= 0; i--) {
  if (stack[i].socketId === socketId) {
    const [removed] = stack.splice(i, 1);
    history.redoStack.push(removed);
    break;
  }
}
```

**Behavior**: Only undo your own strokes. Preserves others' work.

### Trade-offs

| Mode | Pros | Cons |
|------|------|------|
| Global | Simple mental model, feels like shared whiteboard | Can accidentally undo others' work |
| Self | Personal control, no accidental erasure | Confusing when strokes overlap |

---

## Performance Decisions

### 1. Throttled Cursor Updates (30ms)

```javascript
// canvas.js line 87
if (isCursorInsideCanvas && now - lastEmit > 30) {
  emitters.emitCursorMove?.({ x, y });
  lastEmit = now;
}
```

**Why**: Mouse events fire at 60-120Hz. Sending every event would flood the network. 30ms (~33 updates/sec) is visually smooth while reducing bandwidth by 50-75%.

### 2. Local-First Rendering

Drawing appears on the user's screen immediately via local canvas operations. The network broadcast happens in parallel.

**Why**: Eliminates perceived latency. Users don't wait for server round-trip to see their own strokes.

### 3. Incremental Stroke Transmission

During drawing, only coordinates are sent (`mouse-move`). The full stroke object is sent only on `mouse-up`.

**Why**: Reduces payload size during rapid movements. A 100-point stroke sends 100 small coordinate packets instead of one growing JSON object.

### 4. In-Memory State

All room/user/history data is stored in JavaScript `Map` objects.

**Why**: Fastest possible reads/writes. No database latency. Trade-off: data lost on server restart.

---

## Conflict Resolution

### Problem: Simultaneous Drawing

When two users draw at the same time, both emit events. How do we ensure consistency?

### Solution: Append-Only Model

```
User A draws stroke 1  ────►  Server receives  ────►  Appends to undoStack
User B draws stroke 2  ────►  Server receives  ────►  Appends to undoStack

Final undoStack: [stroke1, stroke2] (order depends on arrival time)
```

**Key Insight**: We don't need conflict resolution because strokes are independent. Unlike text editors (where "insert at position 5" can conflict), canvas strokes are additive.

### Ordering Guarantee

Socket.io delivers messages in order per connection. Combined with append-only storage:
- User A's strokes maintain relative order
- User B's strokes maintain relative order
- Interleaving between users depends on arrival time (acceptable for drawing)

### Edge Case: Clear During Draw

```
User A: Drawing stroke...
User B: Clicks Clear
Server: Clears history, broadcasts clear
User A: Completes stroke, sends mouse-up
Server: Adds stroke to now-empty history
```

**Result**: User A's stroke appears after clear. This is the expected behavior—the last action wins.

---

## Components

| Layer | File | Responsibility |
|-------|------|----------------|
| Client | `canvas.js` | Canvas API, tool logic, local state |
| Client | `socket.js` | WebSocket connection, event binding |
| Server | `server.js` | HTTP server, Socket.io init |
| Server | `rooms.js` | Socket event handlers |
| Server | `state-manager.js` | In-memory state (rooms, users, history) |
