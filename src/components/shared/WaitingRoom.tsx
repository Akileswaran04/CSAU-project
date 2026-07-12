import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Users, LogOut, Play, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import type { PresenceState } from "../../lib/supabaseMultiplayer";

interface WaitingRoomProps {
  roomCode: string;
  players: PresenceState[];
  isHost: boolean;
  onStartGame: () => void;
  onLeave: () => void;
}

export function WaitingRoom({
  roomCode,
  players,
  isHost,
  onStartGame,
  onLeave,
}: WaitingRoomProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement("textarea");
      el.value = roomCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const canStart = players.length >= 2 && isHost;

  return (
    <div className="relative min-h-[500px] flex flex-col items-center px-4 py-10">
      {/* Room Code Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center mb-8"
      >
        <p
          className="text-xs font-display font-medium uppercase tracking-widest mb-3"
          style={{ color: "var(--color-fg-muted)" }}
        >
          Room Code
        </p>
        <div
          className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl mb-2"
          style={{
            background: "var(--color-glass-bg)",
            border: "1px solid var(--color-glass-border)",
          }}
        >
          <span
            className="text-4xl font-mono font-bold tracking-[0.2em]"
            style={{ color: "var(--color-fg-default)" }}
          >
            {roomCode}
          </span>
          <button
            onClick={handleCopy}
            className="p-2 rounded-xl transition-colors"
            style={{ color: "var(--color-fg-muted)" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "var(--color-fg-default)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--color-fg-muted)"}
            aria-label="Copy room code"
          >
            {copied ? <Check size={20} /> : <Copy size={20} />}
          </button>
        </div>
        <p
          className="text-xs"
          style={{ color: "var(--color-fg-faint)" }}
        >
          Share this code with other players to join
        </p>
      </motion.div>

      {/* Players List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="w-full max-w-md mb-8"
      >
        <div className="flex items-center justify-between mb-3">
          <h3
            className="text-sm font-display font-semibold"
            style={{ color: "var(--color-fg-default)" }}
          >
            Players ({players.length})
          </h3>
          {players.length < 2 && (
            <span
              className="text-[10px] font-mono uppercase tracking-wider"
              style={{ color: "var(--color-alert-amber)" }}
            >
              Waiting for players...
            </span>
          )}
        </div>

        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {players.map((player) => (
              <motion.div
                key={player.playerId}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{
                  background: player.isHost
                    ? "var(--color-accent-primary-muted)"
                    : "var(--color-glass-bg)",
                  border: `1px solid ${
                    player.isHost
                      ? "var(--color-accent-primary-muted)"
                      : "var(--color-glass-border)"
                  }`,
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold"
                  style={{
                    background: player.isHost
                      ? "var(--color-accent-primary)"
                      : "var(--color-bg-elevated)",
                    color: player.isHost ? "#fff" : "var(--color-fg-muted)",
                  }}
                >
                  {player.playerName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-display font-medium truncate"
                    style={{ color: "var(--color-fg-default)" }}
                  >
                    {player.playerName}
                  </p>
                </div>
                {player.isHost && (
                  <span
                    className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{
                      background: "var(--color-accent-primary-muted)",
                      color: "var(--color-accent-primary)",
                    }}
                  >
                    Host
                  </span>
                )}
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: "var(--color-accent-success)",
                    boxShadow: "0 0 6px rgba(89, 124, 92, 0.5)",
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {players.length === 0 && (
            <div className="text-center py-6">
              <Users
                size={24}
                className="mx-auto mb-2"
                style={{ color: "var(--color-fg-faint)" }}
              />
              <p className="text-xs" style={{ color: "var(--color-fg-faint)" }}>
                No players yet
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex gap-3 w-full max-w-md"
      >
        {isHost ? (
          <Button
            onClick={onStartGame}
            variant="primary"
            size="lg"
            className="flex-1"
            disabled={!canStart}
          >
            {canStart ? (
              <>
                <Play size={18} />
                Start Game
              </>
            ) : (
              <>
                <Loader2 size={18} className="animate-spin" />
                Waiting...
              </>
            )}
          </Button>
        ) : (
          <div className="flex-1 text-center">
            <p
              className="text-sm"
              style={{ color: "var(--color-fg-muted)" }}
            >
              Waiting for host to start the game...
            </p>
          </div>
        )}
        <Button
          onClick={onLeave}
          variant="ghost"
          size="lg"
          aria-label="Leave room"
          style={{ color: "var(--color-fg-muted)" }}
        >
          <LogOut size={18} />
        </Button>
      </motion.div>
    </div>
  );
}
