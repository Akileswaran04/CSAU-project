import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameBoard3D } from "../components/board/GameBoard3D";
import { LeaderboardTable } from "../components/leaderboard/LeaderboardTable";
import { ActionLog } from "../components/controls/ActionLog";
import { useGameStore } from "../store/useGameStore";
import { useSpectatorConnection } from "../hooks/useSpectatorConnection";
import { Button } from "../components/ui/button";
import {
  Trophy,
  Crown,
  Medal,
  Award,
  Eye,
  RefreshCw,
  PanelRightClose,
  PanelRightOpen,
  Users,
  ScrollText,
  DoorOpen,
  LogOut,

  Loader2,
  Wifi,
} from "lucide-react";
import confetti from "canvas-confetti";

/* ═══════════════════════════════════════════════════════════════════════════
   Game Ended Overlay — final results for spectators
   ═══════════════════════════════════════════════════════════════════════════ */
function GameEndedOverlay({ onDisconnect }: { onDisconnect: () => void }) {
  const teams = useGameStore((s) => s.teams);
  const winner = useGameStore((s) => s.winner);

  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => {
      if (b.position !== a.position) return b.position - a.position;
      return b.score - a.score;
    });
  }, [teams]);

  useEffect(() => {
    confetti({
      particleCount: 200,
      spread: 120,
      origin: { y: 0.3 },
      colors: ["#4C8DFF", "#C6F135", "#FFB830", "#E11D3C"],
    });
    const timeout = setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.4, x: 0.3 },
      });
    }, 400);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-mesh-animated"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 200, delay: 0.2 }}
        className="glass-panel-tinted max-w-2xl w-full p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 300, delay: 0.4 }}
          className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6"
          style={{
            background: "var(--color-accent-gold-muted)",
            border: "1px solid rgba(255, 184, 48, 0.3)",
            boxShadow: "0 0 60px rgba(255, 184, 48, 0.2)",
          }}
        >
          <Trophy size={40} className="text-accent-gold" />
        </motion.div>

        <h2 className="text-3xl font-display font-bold text-white mb-2">
          Game Over!
        </h2>
        {winner && (
          <p className="text-accent-gold text-lg font-display font-medium mb-6">
            🏆 {winner.name} wins with {winner.score} points!
          </p>
        )}

        <div className="space-y-3 mb-6">
          {sortedTeams.map((team, i) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className={`glass-panel flex items-center gap-4 p-4 ${
                i === 0 ? "glass-panel-tinted" : ""
              }`}
              style={
                i === 0
                  ? { borderColor: "rgba(255, 184, 48, 0.2)" }
                  : undefined
              }
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-sm"
                style={{
                  backgroundColor: team.color + "20",
                  border: `1px solid ${team.color}40`,
                  color: team.color,
                }}
              >
                {i === 0 ? (
                  <Crown size={20} />
                ) : i === 1 ? (
                  <Medal size={20} />
                ) : i === 2 ? (
                  <Award size={20} />
                ) : (
                  `#${i + 1}`
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-display font-semibold">{team.name}</p>
                <p className="text-fg-muted text-xs font-mono">
                  Cell {Math.min(team.position + 1, 32)} · {team.riddlesCorrect}/{team.riddlesAttempted} riddles
                </p>
              </div>
              <div className="text-right">
                <p className="text-white font-mono font-bold text-xl">{team.score}</p>
                <p className="text-fg-subtle text-xs font-mono">pts</p>
              </div>
            </motion.div>
          ))}
        </div>

        <Button
          onClick={onDisconnect}
          variant="secondary"
          size="lg"
        >
          <LogOut size={18} />
          Leave Results
        </Button>
      </motion.div>
    </motion.div>
  );
}

type PanelMode = "leaderboard" | "log" | "closed";

/* ═══════════════════════════════════════════════════════════════════════════
   Room Code Entry — shown when not spectating an online game
   ═══════════════════════════════════════════════════════════════════════════ */
function RoomEntryView({
  onSpectate,
  isLoading,
  error,
}: {
  onSpectate: (code: string) => void;
  isLoading: boolean;
  error: string | null;
}) {
  const [roomCode, setRoomCode] = useState("");

  const handleSubmit = () => {
    if (roomCode.trim().length >= 4) {
      onSpectate(roomCode.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-ink-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="glass-panel-tinted p-8 text-center">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.1 }}
            className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-6"
            style={{
              background: "var(--color-accent-primary-muted)",
              border: "1px solid var(--color-accent-primary-muted)",
            }}
          >
            <Eye size={40} className="text-accent-primary/60" />
          </motion.div>

          <h2 className="text-2xl font-display font-bold text-white mb-2">
            Spectate a Game
          </h2>
          <p className="text-fg-muted text-sm font-display mb-8">
            Enter the room code to watch a live game in real-time
          </p>

          {/* Room code input */}
          <div className="space-y-4">
            <input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Enter room code"
              className="glass-input w-full text-center text-2xl font-mono font-bold tracking-[0.15em] uppercase"
              maxLength={6}
              autoFocus
            />

            <Button
              onClick={handleSubmit}
              variant="primary"
              size="lg"
              className="w-full"
              disabled={roomCode.trim().length < 4 || isLoading}
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <DoorOpen size={18} />
              )}
              {isLoading ? "Connecting..." : "Watch Game"}
            </Button>
          </div>

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-danger text-sm font-display mt-4"
            >
              {error}
            </motion.p>
          )}
        </div>

        <p className="text-fg-faint text-xs text-center mt-4 font-display">
          You need the room code from the game host to spectate
        </p>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Spectator Page — fullscreen live view with online support
   ═══════════════════════════════════════════════════════════════════════════ */
export function SpectatorPage() {
  const spectator = useSpectatorConnection();
  const { teams, gamePhase, currentTeamIndex } = useGameStore();
  const currentTeam = teams[currentTeamIndex];
  const [panelMode, setPanelMode] = useState<PanelMode>("leaderboard");
  const [showPanel, setShowPanel] = useState(true);

  const togglePanel = useCallback(() => {
    setShowPanel((prev) => !prev);
  }, []);

  const cyclePanel = useCallback(() => {
    setPanelMode((prev) => {
      if (prev === "leaderboard") return "log";
      if (prev === "log") return "leaderboard";
      return "leaderboard";
    });
  }, []);

  const [isSpectating, setIsSpectating] = useState(false);

  const handleSpectate = useCallback(
    async (code: string) => {
      setIsSpectating(true);
      await spectator.spectate(code);
      setIsSpectating(false);
    },
    [spectator]
  );

  const isLoading = isSpectating || (spectator.isConnected && !spectator.roomId);

  // ─── Not spectating: show room code entry ───
  if (!spectator.isConnected) {
    return (
      <RoomEntryView
        onSpectate={handleSpectate}
        isLoading={isLoading}
        error={spectator.error}
      />
    );
  }

  // ─── Spectating: show fullscreen board with live state ───
  const isActive = gamePhase === "active";
  const hasTeams = teams.length > 0;

  return (
    <div className="fixed inset-0 z-40 bg-ink-900">
      {/* ─── Fullscreen Board ─── */}
      <div className="absolute inset-0">
        <GameBoard3D onToggleFullscreen={() => {}} isFullscreen={true} />
      </div>

      {/* ─── Top HUD Bar ─── */}
      <div className="absolute top-0 left-0 right-0 z-30 p-4 flex items-center justify-between pointer-events-none">
        {/* Left: Brand + status */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "var(--color-accent-primary-muted)",
              border: "1px solid var(--color-accent-primary-muted)",
            }}
          >
            <Eye size={18} className="text-accent-primary" />
          </div>
          <div>
            <h1 className="text-white text-sm font-display font-bold leading-tight">
              Spectator
            </h1>
            <div className="flex items-center gap-1.5">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  isActive
                    ? "bg-accent-success animate-pulse"
                    : gamePhase === "paused"
                      ? "bg-accent-gold"
                      : gamePhase === "ended"
                        ? "bg-danger"
                        : "bg-white/15"
                }`}
              />
              <span className="text-white/50 text-[10px] font-display font-medium uppercase tracking-wider">
                {gamePhase === "idle"
                  ? "Waiting"
                  : isActive
                    ? "Live"
                    : gamePhase === "paused"
                      ? "Paused"
                      : "Game Over"}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Room info + current team */}
        <div className="hidden sm:flex items-center gap-3 pointer-events-auto">
          {/* Room badge */}
          {spectator.roomId && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono"
              style={{
                background: "var(--color-glass-blue-06)",
                border: "1px solid var(--color-glass-blue-10)",
                color: "var(--color-accent-primary)",
              }}
            >
              <Wifi size={10} />
              {spectator.roomId}
            </div>
          )}

          {/* Current team */}
          {currentTeam && isActive && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{
                background: currentTeam.color + "15",
                border: `1px solid ${currentTeam.color}30`,
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: currentTeam.color }}
              />
              <span
                className="text-sm font-display font-medium"
                style={{ color: currentTeam.color }}
              >
                {currentTeam.name}&apos;s Turn
              </span>
            </div>
          )}
        </div>

        {/* Right: Panel controls + disconnect */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Connection badge */}
          <div className="hidden sm:flex items-center gap-1.5 text-white/40 text-xs font-mono bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <Users size={12} />
            <span>
              {teams.length} team{teams.length !== 1 ? "s" : ""}
            </span>
          </div>

          {showPanel && (
            <Button
              onClick={cyclePanel}
              variant="ghost"
              size="sm"
              className="!text-white/40 hover:!text-white bg-black/30 backdrop-blur-sm"
              aria-label={
                panelMode === "leaderboard" ? "Switch to action log" : "Switch to leaderboard"
              }
            >
              {panelMode === "leaderboard" ? (
                <ScrollText size={16} />
              ) : (
                <Trophy size={16} />
              )}
            </Button>
          )}

          <Button
            onClick={togglePanel}
            variant="ghost"
            size="sm"
            className="!text-white/40 hover:!text-white bg-black/30 backdrop-blur-sm"
            aria-label={showPanel ? "Close panel" : "Open panel"}
          >
            {showPanel ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </Button>

          <Button
            onClick={spectator.disconnect}
            variant="ghost"
            size="sm"
            className="!text-white/30 hover:!text-danger bg-black/30 backdrop-blur-sm"
            aria-label="Disconnect from game"
          >
            <LogOut size={16} />
          </Button>
        </div>
      </div>

      {/* ─── Bottom HUD ─── */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3, ease: "easeOut" }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30"
      >
        <div className="glass-panel-tinted rounded-2xl px-5 py-3 flex items-center gap-4 sm:gap-5">
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isActive
                  ? "bg-accent-success animate-pulse"
                  : gamePhase === "paused"
                    ? "bg-accent-gold"
                    : gamePhase === "ended"
                      ? "bg-danger"
                      : "bg-white/15"
              }`}
            />
            <span className="text-white/70 text-sm font-display font-medium capitalize">
              {gamePhase === "idle"
                ? "Waiting"
                : isActive
                  ? "Live"
                  : gamePhase === "paused"
                    ? "Paused"
                    : "Game Over"}
            </span>
          </div>

          {currentTeam && isActive && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{
                background: currentTeam.color + "15",
                border: `1px solid ${currentTeam.color}30`,
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: currentTeam.color }}
              />
              <span
                className="text-sm font-display font-medium"
                style={{ color: currentTeam.color }}
              >
                {currentTeam.name}
              </span>
            </div>
          )}

          {spectator.roomId && (
            <div className="hidden sm:flex items-center gap-1.5 text-white/40 text-xs font-mono">
              <Wifi size={12} />
              <span>{spectator.roomId}</span>
            </div>
          )}

          <div className="hidden sm:flex items-center gap-1.5 text-white/40 text-sm font-mono">
            <RefreshCw size={14} className="animate-spin-slow" />
            <span>Live</span>
          </div>
        </div>
      </motion.div>

      {/* ─── Side Panel ─── */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            key={panelMode}
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute top-20 right-4 bottom-24 z-20 w-[360px] max-w-[calc(100vw-2rem)] overflow-y-auto"
          >
            <div className="pr-1">
              {panelMode === "leaderboard" ? <LeaderboardTable /> : <ActionLog />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Game Over overlay ─── */}
      <AnimatePresence>
        {gamePhase === "ended" && hasTeams && (
          <GameEndedOverlay onDisconnect={spectator.disconnect} />
        )}
      </AnimatePresence>

      {/* ─── Empty state overlay (connected but no game yet) ─── */}
      <AnimatePresence>
        {!hasTeams && gamePhase === "idle" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 15, stiffness: 200 }}
                className="w-24 h-24 mx-auto rounded-3xl flex items-center justify-center mb-6"
                style={{
                  background: "var(--color-accent-primary-muted)",
                  border: "1px solid var(--color-accent-primary-muted)",
                }}
              >
                <Eye size={48} className="text-accent-primary/60" />
              </motion.div>
              <h2 className="text-2xl font-display font-bold text-white/60 mb-2">
                Connected — Waiting for the game to start
              </h2>
              <p className="text-fg-muted font-display">
                The game board will appear here once the host starts playing
              </p>

              {spectator.roomId && (
                <div
                  className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full"
                  style={{
                    background: "var(--color-glass-blue-06)",
                    border: "1px solid var(--color-glass-blue-10)",
                    color: "var(--color-accent-primary)",
                  }}
                >
                  <Wifi size={14} />
                  <span className="text-xs font-mono font-bold tracking-wider">
                    {spectator.roomId}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
