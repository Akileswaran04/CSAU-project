/**
 * useMultiplayer — rewritten to use Supabase Realtime.
 *
 * This is a compatibility wrapper around useRealtimeRoom that matches
 * the previous Socket.IO-based API surface.
 */
export { useRealtimeRoom as useMultiplayer } from "./useRealtimeRoom";
export type { PresenceState } from "../lib/supabaseMultiplayer";
