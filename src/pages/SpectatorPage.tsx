import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameBoard3D } from "../components/board/GameBoard3D";
import { LeaderboardTable } from "../components/leaderboard/LeaderboardTable";
import { ActionLog } from "../components/controls/ActionLog";
import { useGameStore } from "../store/useGameStore";
import { Button } from "../components/ui/button";
import {
  Trophy,
  Eye,
  Play,
  Pause,
  RefreshCw,
  PanelRightClose,
  PanelRightOpen,
  LayoutDashboard,
  Users,
  ScrollText,
} from "lucide-react";

type PanelMode = "leaderboard" | "log" | "closed";

/**
 * Spectator Page — always fullscreen live view with toggleable overlay panels.
 * Shows the board full-viewport with a floating HUD and side panel.
 */
export function SpectatorPage() {
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
                  gamePhase === "active"
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
                  : gamePhase === "active"
                    ? "Live"
                    : gamePhase === "paused"
                      ? "Paused"
                      : "Game Over"}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Current team indicator */}
        {currentTeam && gamePhase === "active" && (
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full pointer-events-auto"
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

        {/* Right: Panel controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="hidden sm:flex items-center gap-1.5 text-white/40 text-xs font-mono bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <Trophy size={12} />
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
        </div>
      </div>

      {/* ─── Bottom HUD: Game status ─── */}
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

          {currentTeam && gamePhase === "active" && (
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

          <div className="hidden sm:flex items-center gap-1.5 text-white/40 text-sm font-mono">
            <RefreshCw size={14} className="animate-spin-slow" />
            <span>Live</span>
          </div>
        </div>
      </motion.div>

      {/* ─── Side Panel (animated) ─── */}
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

      {/* ─── Empty state overlay ─── */}
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
                <Eye size={48} className="text-accent-primary/60" />
              </motion.div>
              <h2 className="text-2xl font-display font-bold text-white/60 mb-2">
                Waiting for the game to start
              </h2>
              <p className="text-fg-muted font-display">
                The game board and standings will appear here live
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
