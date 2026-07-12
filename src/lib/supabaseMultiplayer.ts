/**
 * Supabase Realtime Multiplayer Service
 *
 * Uses Supabase Realtime Channels for all multiplayer functionality:
 * - Anonymous auth for player identification
 * - Channel-based rooms with presence tracking
 * - Broadcast for game state sync
 * - Database-backed room/player persistence for reconnection
 *
 * All free-tier Supabase features — no WebSocket server needed.
 */
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { RealtimeChannel } from "@supabase/supabase-js";
import type { GameState } from "../store/useGameStore";

/* ─── Types ─── */

export interface RoomPlayer {
  id: string;
  room_code: string;
  player_name: string;
  is_host: boolean;
  player_id: string;
  joined_at: string;
}

export interface PresenceState {
  playerId: string;
  playerName: string;
  isHost: boolean;
  onlineAt: number;
}

export type GameEvent =
  | { type: "game:state"; state: any }
  | { type: "game:started" }
  | { type: "game:ended"; winner: any }
  | { type: "player:joined"; player: PresenceState }
  | { type: "player:left"; playerId: string };

export type StateListener = (state: any) => void;
export type PresenceListener = (players: PresenceState[]) => void;
export type ErrorListener = (error: string) => void;

/* ─── State ─── */

let playerChannel: RealtimeChannel | null = null;
let spectatorChannel: RealtimeChannel | null = null;
let currentUserId: string | null = null;
let currentPlayerName: string | null = null;

const listeners = {
  state: new Set<StateListener>(),
  presence: new Set<PresenceListener>(),
  error: new Set<ErrorListener>(),
};

/* ─── Auth ─── */

/**
 * Sign in anonymously to get a persistent user ID.
 * Required for room creation, joining, and spectating.
 */
export async function ensureAuthenticated(): Promise<string> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured");
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    currentUserId = session.user.id;
    return session.user.id;
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    const msg = error.message || "";
    if (msg.includes("Anonymous")) {
      throw new Error(
        "Anonymous sign-ins are disabled. Go to Supabase Dashboard → Authentication → Providers → " +
        "enable 'Anonymous Sign-Ins'."
      );
    }
    if (msg.includes("Signups") || msg.includes("signups")) {
      throw new Error(
        "User sign-ups are disabled. Go to Supabase Dashboard → Authentication → Settings → " +
        "turn ON 'Allow new users to sign up'."
      );
    }
    throw new Error(`Auth failed: ${msg}`);
  }
  if (!data.user) throw new Error("Auth returned no user");

  currentUserId = data.user.id;
  return data.user.id;
}

export function getUserId(): string | null {
  return currentUserId;
}

/* ─── Room Operations ─── */

export async function fetchRoom(code: string): Promise<{
  room: { code: string; status: string; host_player_id: string; game_state: any } | null;
  players: RoomPlayer[];
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { room: null, players: [] };
  }

  const { data: room } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", code.toUpperCase())
    .single();

  const { data: players } = await supabase
    .from("room_players")
    .select("*")
    .eq("room_code", code.toUpperCase())
    .order("joined_at");

  return {
    room: room as any || null,
    players: (players as RoomPlayer[]) || [],
  };
}

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createRoom(playerName: string): Promise<{
  ok: boolean;
  roomCode?: string;
  error?: string;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: "Supabase is not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY" };
  }

  try {
    const userId = await ensureAuthenticated();
    let roomCode = generateRoomCode();

    let attempts = 0;
    while (attempts < 5) {
      const existing = await fetchRoom(roomCode);
      if (!existing.room) break;
      roomCode = generateRoomCode();
      attempts++;
    }

    if (attempts >= 5) {
      return { ok: false, error: "Could not generate unique room code" };
    }

    const { error: roomError } = await supabase.from("rooms").insert({
      code: roomCode,
      host_player_id: userId,
      status: "waiting",
    });

    if (roomError) {
      return { ok: false, error: `Failed to create room: ${roomError.message}` };
    }

    const { error: playerError } = await supabase.from("room_players").insert({
      room_code: roomCode,
      player_name: playerName,
      is_host: true,
      player_id: userId,
    });

    if (playerError) {
      await supabase.from("rooms").delete().eq("code", roomCode);
      return { ok: false, error: `Failed to register player: ${playerError.message}` };
    }

    currentPlayerName = playerName;
    joinRoomChannel(roomCode, playerName, userId, true);

    return { ok: true, roomCode };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Failed to create room" };
  }
}

export async function joinRoom(roomCode: string, playerName: string): Promise<{
  ok: boolean;
  roomCode?: string;
  error?: string;
  gameState?: any;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: "Supabase is not configured" };
  }

  try {
    const userId = await ensureAuthenticated();
    const normalizedCode = roomCode.toUpperCase();

    const { room, players } = await fetchRoom(normalizedCode);
    if (!room) return { ok: false, error: "Room not found" };
    if (room.status !== "waiting") return { ok: false, error: "Game already in progress" };
    if (players.length >= 8) return { ok: false, error: "Room is full" };

    const existingPlayer = players.find(p => p.player_id === userId);
    if (!existingPlayer) {
      const { error: playerError } = await supabase.from("room_players").insert({
        room_code: normalizedCode,
        player_name: playerName,
        is_host: false,
        player_id: userId,
      });
      if (playerError) return { ok: false, error: `Failed to join: ${playerError.message}` };
    }

    currentPlayerName = playerName;
    joinRoomChannel(normalizedCode, playerName, userId, false);

    return { ok: true, roomCode: normalizedCode, gameState: room.game_state };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Failed to join room" };
  }
}

/**
 * Spectate a room — joins the SAME Realtime Channel as players (to receive broadcasts)
 * but does NOT track presence (invisible spectator).
 *
 * - Joins topic `room:{roomCode}` (same as players) to receive their broadcasts
 * - Does NOT call channel.track() — invisible in presence
 * - Still receives presence updates (other players' presence is visible)
 * - If a player channel was active, it stays active (spectators and players coexist)
 */
export async function spectateRoom(roomCode: string): Promise<{
  ok: boolean;
  error?: string;
  gameState?: any;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: "Supabase is not configured" };
  }

  try {
    const userId = await ensureAuthenticated();
    const normalizedCode = roomCode.toUpperCase();

    const { room } = await fetchRoom(normalizedCode);
    if (!room) return { ok: false, error: "Room not found" };

    // Unsubscribe previous spectator channel if any
    if (spectatorChannel) {
      spectatorChannel.unsubscribe();
      spectatorChannel = null;
    }

    // Join the SAME channel as players — use the same topic so broadcasts are received
    const channel = supabase.channel(`room:${normalizedCode}`, {
      config: {
        broadcast: { self: false },
        presence: { key: userId },
      },
    });

    // Listen for presence (see who's playing)
    channel.on("presence", { event: "sync" }, () => {
      const presenceState = channel.presenceState();
      const onlinePlayers: PresenceState[] = [];
      for (const [, state] of Object.entries(presenceState)) {
        const presences = state as any[];
        if (presences.length > 0) {
          onlinePlayers.push(presences[0] as PresenceState);
        }
      }
      onlinePlayers.sort((a, b) => (a.isHost ? -1 : 1) - (b.isHost ? -1 : 1));
      listeners.presence.forEach(fn => fn(onlinePlayers));
    });

    // Listen for game state broadcasts
    channel.on("broadcast", { event: "game:state" }, ({ payload }) => {
      if (payload.state) {
        listeners.state.forEach(fn => fn(payload.state));
      }
    });

    // Subscribe but do NOT track presence — invisible to other clients
    channel.subscribe();

    spectatorChannel = channel;
    return { ok: true, gameState: room.game_state };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Failed to spectate room" };
  }
}

/**
 * Leave the current room and disconnect.
 */
export async function leaveRoom(): Promise<void> {
  if (playerChannel) {
    await playerChannel.untrack();
    playerChannel.unsubscribe();
    playerChannel = null;
  }
  disconnectSpectator();
  currentPlayerName = null;
  listeners.state.clear();
  listeners.presence.clear();
  listeners.error.clear();
}

/** Disconnect spectator channel only (keeps player channel active) */
export function disconnectSpectator(): void {
  if (spectatorChannel) {
    spectatorChannel.unsubscribe();
    spectatorChannel = null;
  }
}

/* ─── Realtime Channel (for players) ─── */

function joinRoomChannel(
  roomCode: string,
  playerName: string,
  userId: string,
  isHost: boolean,
): void {
  if (!supabase) return;

  if (playerChannel) {
    playerChannel.unsubscribe();
  }

  const channel = supabase.channel(`room:${roomCode}`, {
    config: {
      broadcast: { self: true },
      presence: { key: userId },
    },
  });

  channel.on("presence", { event: "sync" }, () => {
    const presenceState = channel.presenceState();
    const onlinePlayers: PresenceState[] = [];
    for (const [, state] of Object.entries(presenceState)) {
      const presences = state as any[];
      if (presences.length > 0) {
        onlinePlayers.push(presences[0] as PresenceState);
      }
    }
    onlinePlayers.sort((a, b) => (a.isHost ? -1 : 1) - (b.isHost ? -1 : 1));
    listeners.presence.forEach(fn => fn(onlinePlayers));
  });

  channel.on("broadcast", { event: "game:state" }, ({ payload }) => {
    if (payload.state) {
      listeners.state.forEach(fn => fn(payload.state));
    }
  });

  channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      await channel.track({
        playerId: userId,
        playerName,
        isHost,
        onlineAt: Date.now(),
      });
    }
  });

  playerChannel = channel;
}

/* ─── Broadcast ─── */

export function broadcastGameState(state: any): void {
  if (!playerChannel) return;
  playerChannel.send({
    type: "broadcast",
    event: "game:state",
    payload: { state },
  });
}

export function broadcastGameEvent(event: string, payload?: any): void {
  if (!playerChannel) return;
  playerChannel.send({
    type: "broadcast",
    event: "game:event",
    payload: { event, ...payload },
  });
}

export async function deleteRoom(roomCode: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from("room_players").delete().eq("room_code", roomCode);
  await supabase.from("rooms").delete().eq("code", roomCode);
}

export async function persistGameState(roomCode: string, state: any): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from("rooms").update({
    game_state: state,
    status: state.gamePhase === "ended" ? "ended" : "playing",
  }).eq("code", roomCode);
}

/* ─── External Listeners ─── */

export function onStateChange(fn: StateListener): () => void {
  listeners.state.add(fn);
  return () => listeners.state.delete(fn);
}

export function onPresenceChange(fn: PresenceListener): () => void {
  listeners.presence.add(fn);
  return () => listeners.presence.delete(fn);
}

export function onError(fn: ErrorListener): () => void {
  listeners.error.add(fn);
  return () => listeners.error.delete(fn);
}

/* ─── Connection Status ─── */

export function isConnected(): boolean {
  return playerChannel !== null && playerChannel.state === "joined";
}

export function isSpectating(): boolean {
  return spectatorChannel !== null && (spectatorChannel.state === "joined" || spectatorChannel.state === "subscribed");
}

export function getCurrentRoomCode(): string | null {
  if (playerChannel) {
    const topic = playerChannel.topic;
    if (topic.startsWith("room:")) return topic.slice(5);
  }
  return null;
}
