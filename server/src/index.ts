import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const PORT = parseInt(process.env.PORT || "3001", 10);

const app = express();
app.use(cors());
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// ─── Game Room Types ───
interface GameState {
  teams: any[];
  gamePhase: string;
  currentTeamIndex: number;
  diceResult: number | null;
  isRolling: boolean;
  winner: any | null;
}

interface GameRoom {
  id: string;
  players: Map<string, { id: string; name: string; isHost: boolean }>;
  spectators: Set<string>;
  state: GameState;
}

const rooms = new Map<string, GameRoom>();

// ─── Socket Handlers ───
io.on("connection", (socket) => {
  console.log(`[connect] ${socket.id}`);

  // ─── Create a new game room ───
  socket.on("room:create", ({ playerName }, callback) => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const room: GameRoom = {
      id: roomId,
      players: new Map(),
      spectators: new Set(),
      state: {
        teams: [],
        gamePhase: "idle",
        currentTeamIndex: 0,
        diceResult: null,
        isRolling: false,
        winner: null,
      },
    };
    room.players.set(socket.id, { id: socket.id, name: playerName, isHost: true });
    rooms.set(roomId, room);
    socket.join(roomId);
    console.log(`[room:create] ${roomId} by ${playerName}`);

    callback({
      ok: true,
      roomId,
      players: Array.from(room.players.values()),
    });
    io.to(roomId).emit("room:players", Array.from(room.players.values()));
  });

  // ─── Join an existing room ───
  socket.on("room:join", ({ roomId, playerName }, callback) => {
    const room = rooms.get(roomId?.toUpperCase());
    if (!room) {
      callback({ ok: false, error: "Room not found" });
      return;
    }
    if (room.players.size >= 8) {
      callback({ ok: false, error: "Room is full" });
      return;
    }
    room.players.set(socket.id, {
      id: socket.id,
      name: playerName,
      isHost: false,
    });
    socket.join(roomId);
    console.log(`[room:join] ${socket.id} joined ${roomId}`);

    callback({
      ok: true,
      roomId,
      players: Array.from(room.players.values()),
      gameState: room.state,
    });
    io.to(roomId).emit("room:players", Array.from(room.players.values()));
    io.to(roomId).emit("game:state", room.state);
  });

  // ─── Game state update from host ───
  socket.on("game:update", (partialState: Partial<GameState>) => {
    const room = findRoom(socket);
    if (!room) return;

    // Only host can update state
    const player = room.players.get(socket.id);
    if (!player?.isHost) return;

    room.state = { ...room.state, ...partialState };
    socket.to(room.id).emit("game:state", room.state);
  });

  // ─── Full state replacement (used when Zustand persists) ───
  socket.on("game:sync", (fullState: GameState) => {
    const room = findRoom(socket);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player?.isHost) return;

    room.state = fullState;
    socket.to(room.id).emit("game:state", fullState);
  });

  // ─── Spectate a room (read-only, no player slot) ───
  socket.on("room:spectate", ({ roomId }, callback) => {
    const room = rooms.get(roomId?.toUpperCase());
    if (!room) {
      callback({ ok: false, error: "Room not found" });
      return;
    }
    room.spectators.add(socket.id);
    socket.join(roomId);
    console.log(`[room:spectate] ${socket.id} watching ${roomId}`);

    callback({
      ok: true,
      roomId,
      gameState: room.state,
      players: Array.from(room.players.values()),
    });
    socket.emit("game:state", room.state);
  });

  // ─── Request current game state ───
  socket.on("game:requestState", () => {
    const room = findRoom(socket);
    if (!room) return;
    socket.emit("game:state", room.state);
  });

  // ─── Disconnect ───
  socket.on("disconnect", () => {
    console.log(`[disconnect] ${socket.id}`);
    for (const [roomId, room] of rooms.entries()) {
      // Remove from players
      if (room.players.has(socket.id)) {
        room.players.delete(socket.id);
        io.to(roomId).emit("room:players", Array.from(room.players.values()));

        if (room.players.size === 0 && room.spectators.size === 0) {
          rooms.delete(roomId);
          console.log(`[room:delete] ${roomId} (empty)`);
        }
        break;
      }
      // Remove from spectators
      if (room.spectators.has(socket.id)) {
        room.spectators.delete(socket.id);
        console.log(`[spectator:leave] ${socket.id} left ${roomId}`);
        if (room.players.size === 0 && room.spectators.size === 0) {
          rooms.delete(roomId);
          console.log(`[room:delete] ${roomId} (empty)`);
        }
        break;
      }
    }
  });

});

function findRoom(socket: any): GameRoom | undefined {
  for (const [, room] of rooms.entries()) {
    if (room.players.has(socket.id)) return room;
  }
  return undefined;
}

// ─── Health check ───
app.get("/health", (_req, res) => {
  res.json({ ok: true, rooms: rooms.size, players: countPlayers() });
});

function countPlayers(): number {
  let count = 0;
  for (const [, room] of rooms.entries()) {
    count += room.players.size;
  }
  return count;
}

httpServer.listen(PORT, () => {
  console.log(`🎲 Riddle Rush server running on port ${PORT}`);
});
