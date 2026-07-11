// No dynamic refresh needed — Zustand store is reactive
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameBoard3D } from "../components/board/GameBoard3D";
import { LeaderboardTable } from "../components/leaderboard/LeaderboardTable";
import { ActionLog } from "../components/controls/ActionLog";
import { useGameStore } from "../store/useGameStore";
import { Trophy, Eye, Play, Pause, RefreshCw, Minimize2, Maximize2 } from "lucide-react";

/**
 * Spectator Page — read-only live view of the game.
 * Shows the board, leaderboard, and action log for audiences.
 */
export function SpectatorPage() {
  const { teams, gamePhase, currentTeamIndex } = useGameStore();
  const currentTeam = teams[currentTeamIndex];

  // ─── Fullscreen state (no persistence) ───
  const [spectatorFullscreen, setSpectatorFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    setSpectatorFullscreen((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "f" || e.key === "F") {
        setSpectatorFullscreen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // ─── Fullscreen Mode ───
  if (spectatorFullscreen) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="fixed inset-0 z-50 bg-ink-900"
      >
        {/* Fullscreen board — fills entire viewport */}
        <div className="absolute inset-0">
          <GameBoard3D onToggleFullscreen={toggleFullscreen} isFullscreen={true} />
        </div>

        {/* Floating spectator HUD — bottom-center */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3, ease: "easeOut" }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30"
        >
          <div
            className="glass-panel-tinted rounded-2xl px-5 py-3 flex items-center gap-5"
            style={{ backdropFilter: "blur(20px)" }}
          >
            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  gamePhase === "active"
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
                  : gamePhase === "active"
                    ? "Live"
                    : gamePhase === "paused"
                      ? "Paused"
                      : "Game Over"}
              </span>
            </div>

            {/* Current team */}
            {currentTeam && gamePhase === "active" && (
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{
                  background: currentTeam.color + "15",
                  border: `1px solid ${currentTeam.color}30`,
                }}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentTeam.color }} />
                <span className="text-sm font-display font-medium" style={{ color: currentTeam.color }}>
                  {currentTeam.name}
                </span>
              </div>
            )}

            {/* Team count */}
            <div className="flex items-center gap-1.5 text-white/40 text-sm font-mono">
              <Trophy size={14} />
              <span>{teams.length} team{teams.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </motion.div>

        {/* Exit fullscreen — top-left */}
        <motion.button
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.25 }}
          onClick={toggleFullscreen}
          className="absolute top-4 left-4 z-30 glass-button p-2.5 text-white/50 hover:text-white flex items-center gap-2"
          aria-label="Exit fullscreen view"
        >
          <Minimize2 size={18} aria-hidden="true" />
          <span className="text-sm font-display font-medium hidden sm:inline">Exit</span>
        </motion.button>
      </motion.div>
    );
  }

  // ─── Normal Mode ───
  return (
    <div className="min-h-screen">
      {/* Spectator header bar */}
      <div className="sticky top-0 z-40 backdrop-blur-lg border-b border-white/[0.04]"
        style={{ background: "var(--color-bg-header)" }}>
        <div className="p-4 px-6">
          <div className="glass-panel-tinted p-4 px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: "var(--color-accent-primary-muted)",
                    border: "1px solid var(--color-accent-primary-muted)",
                  }}
                >
                  <Eye size={18} className="text-jade" />
                </div>
                <div>
                  <h1 className="text-lg font-display font-bold text-white">
                    Spectator View
                  </h1>
                  <p className="text-white/40 text-xs font-display">
                    Live game feed — read-only
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-5">
                {/* Game status */}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      gamePhase === "active"
                        ? "bg-accent-success animate-pulse"
                        : gamePhase === "paused"
                          ? "bg-accent-gold"
                          : gamePhase === "ended"
                            ? "bg-danger"
                            : "bg-white/15"
                    }`}
                  />
                  <span className="text-white/60 text-sm font-display font-medium capitalize">
                    {gamePhase === "idle"
                      ? "Waiting for players..."
                      : gamePhase === "active"
                        ? "Live"
                        : gamePhase === "paused"
                          ? "Paused"
                          : "Game Over"}
                  </span>
                </div>

                {/* Current team indicator */}
                {currentTeam && gamePhase === "active" && (
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full"
                    style={{
                      background: currentTeam.color + "15",
                      border: `1px solid ${currentTeam.color}30`,
                    }}>
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: currentTeam.color }}
                    />
                    <span
                      className="text-sm font-display font-medium"
                      style={{ color: currentTeam.color }}
                    >
                      {currentTeam.name}'s Turn
                    </span>
                  </div>
                )}

                {/* Team count */}
                <div className="hidden md:flex items-center gap-1.5 text-white/40 text-sm font-mono">
                  <Trophy size={14} />
                  <span>{teams.length} team{teams.length !== 1 ? "s" : ""}</span>
                </div>

                {/* Fullscreen toggle */}
                <button
                  onClick={toggleFullscreen}
                  className="glass-button p-2 text-white/40 hover:text-white"
                  aria-label="Enter fullscreen view"
                  title="Fullscreen (F)"
                >
                  <Maximize2 size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content — increased spacing */}
      <div className="flex flex-col lg:flex-row gap-6 p-6">
        {/* Board */}
        <div className="flex-1 min-h-[500px] lg:min-h-[calc(100vh-100px)]">
          <div className="relative h-full rounded-2xl overflow-hidden glass-panel p-1">
            <div className="w-full h-full min-h-[480px] lg:min-h-[calc(100vh-120px)] rounded-xl overflow-hidden">
              <GameBoard3D onToggleFullscreen={toggleFullscreen} />
            </div>
          </div>

          {/* Spectator info overlay */}
          <motion.div
            data-spectator-indicator
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 glass-panel p-5 flex items-center justify-between"
          >
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <RefreshCw size={14} className="animate-spin-slow" />
              <span>Live — updates in real-time</span>
            </div>
            <div className="flex items-center gap-2 text-white/30 text-xs">
              {currentTeam && gamePhase === "active" ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-success animate-pulse" />
                  Currently playing: {currentTeam.name}
                </span>
              ) : gamePhase === "paused" ? (
                <span className="flex items-center gap-1.5">
                  <Pause size={12} />
                  Game paused
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Play size={12} />
                  Waiting for game to start
                </span>
              )}
            </div>
          </motion.div>
        </div>

        {/* Sidebar: Leaderboard + Log — increased spacing */}
        <div className="w-full lg:w-[380px] flex flex-col gap-6">
          <LeaderboardTable />
          <ActionLog />
        </div>
      </div>

      {/* Full-screen overlay when no game is active */}
      <AnimatePresence>
        {teams.length === 0 && gamePhase === "idle" && (
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
                <Eye size={48} className="text-jade/60" />
              </motion.div>
              <h2 className="text-2xl font-display font-bold text-white/60 mb-2">
                Waiting for the game to start
              </h2>
              <p className="text-white/30 font-display">
                The game board and standings will appear here live
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
