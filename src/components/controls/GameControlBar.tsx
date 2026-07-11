import { useState, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  StopCircle,
  SkipForward,
} from "lucide-react";
import { useGameStore } from "../../store/useGameStore";
import { TeamIconDisplay } from "../shared/TeamIconDisplay";
import { useLogStore } from "../../store/useLogStore";
import { useRiddleStore } from "../../store/useRiddleStore";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import { toast } from "sonner";
import { sounds } from "../../lib/sound";
import confetti from "canvas-confetti";

export function GameControlBar() {
  const {
    teams,
    gamePhase,
    currentTeamIndex,
    setGamePhase,
    setActiveTeamId,
    advanceTurn,
    resetGame,
  } = useGameStore();

  const clearLog = useLogStore((s) => s.clearLog);
  const resetUsedRiddles = useRiddleStore((s) => s.resetUsedRiddles);

  const [confirmAction, setConfirmAction] = useState<"reset" | "end" | null>(
    null
  );

  const currentTeam = teams[currentTeamIndex];

  const addLogEntry = useCallback(
    (message: string) => {
      useLogStore.getState().addEntry({
        teamId: null,
        teamName: "system",
        message,
        type: "system",
      });
    },
    []
  );

  const handleStart = useCallback(() => {
    if (teams.length < 2) {
      toast.error("Need at least 2 teams to start");
      return;
    }
    setGamePhase("active");
    setActiveTeamId(teams[0]?.id || null);
    sounds.turnAdvance.play();
    toast.success("Game started!");
    addLogEntry("Game started!");
  }, [teams, setGamePhase, setActiveTeamId, addLogEntry]);

  const handlePause = useCallback(() => {
    if (gamePhase === "active") {
      setGamePhase("paused");
      toast.info("Game paused");
      addLogEntry("Game paused");
    } else if (gamePhase === "paused") {
      setGamePhase("active");
      toast.success("Game resumed");
      addLogEntry("Game resumed");
    }
  }, [gamePhase, setGamePhase, addLogEntry]);

  const handleReset = useCallback(() => {
    resetGame();
    clearLog();
    resetUsedRiddles();
    toast.info("Game reset");
  }, [resetGame, clearLog, resetUsedRiddles]);

  const handleEnd = useCallback(() => {
    setGamePhase("ended");
    addLogEntry("Game ended!");

    if (teams.length > 0) {
      sounds.victory.play();
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.4 },
        colors: ["#4C8DFF", "#C6F135", "#FFB830", "#E11D3C", "#A0AEC0"],
      });
      setTimeout(() => {
        confetti({
          particleCount: 150,
          spread: 120,
          origin: { y: 0.5, x: 0.3 },
        });
      }, 300);
      setTimeout(() => {
        confetti({
          particleCount: 150,
          spread: 120,
          origin: { y: 0.5, x: 0.7 },
        });
      }, 600);
    }

    toast.success("Game ended! Check the leaderboard for final standings.");
  }, [setGamePhase, teams, addLogEntry]);

  const handleAdvanceTurn = useCallback(() => {
    advanceTurn();
    sounds.turnAdvance.play();
    const nextName =
      teams[(currentTeamIndex + 1) % teams.length]?.name || "next team";
    addLogEntry(`Turn advanced to ${nextName}`);
  }, [advanceTurn, teams, currentTeamIndex, addLogEntry]);

  const isActive = gamePhase === "active";
  const isPaused = gamePhase === "paused";

  return (
    <div className="glass-panel-tinted p-3 px-5">
      <div className="flex items-center justify-between">
        {/* Game status */}
        <div className="flex items-center gap-3">
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
          <span className="text-white/60 text-sm font-display font-medium">
            {gamePhase === "idle"
              ? "Not Started"
              : gamePhase === "active"
                ? "Live"
                : gamePhase === "paused"
                  ? "Paused"
                  : "Ended"}
          </span>
        </div>

        {/* Turn indicator */}
        {currentTeam && isActive && (
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-sm">Turn:</span>
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: currentTeam.color + "20",
                border: `1px solid ${currentTeam.color}40`,
                color: currentTeam.color,
              }}
            >
              <TeamIconDisplay icon={currentTeam.icon} size={12} />
            </div>
            <span className="text-white font-display font-medium text-sm">
              {currentTeam.name}
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {gamePhase === "idle" && (
            <button
              onClick={handleStart}
              disabled={teams.length < 2}
              aria-label="Start game"
              className="glass-button flex items-center gap-2 px-5 py-2.5 font-display font-semibold text-white disabled:text-white/20 disabled:cursor-not-allowed"
              style={
                teams.length >= 2
                  ? {
                      background: "var(--color-accent-success-muted)",
                      borderColor: "rgba(198, 241, 53, 0.25)",
                    }
                  : undefined
              }
            >
              <Play size={18} aria-hidden="true" />
              Start
            </button>
          )}

          {(isActive || isPaused) && (
            <>
              <button
                onClick={handlePause}
                className="glass-button flex items-center gap-2 px-4 py-2.5 font-display font-medium text-white"
                style={{
                  background: isActive
                    ? "rgba(255, 184, 48, 0.12)"
                    : "rgba(198, 241, 53, 0.12)",
                  borderColor: isActive
                    ? "rgba(255, 184, 48, 0.2)"
                    : "rgba(198, 241, 53, 0.2)",
                }}
              >
                {isActive ? <Pause size={18} /> : <Play size={18} />}
                {isActive ? "Pause" : "Resume"}
              </button>

              {isActive && (
                <button
                  onClick={handleAdvanceTurn}
                  className="glass-button flex items-center gap-2 px-4 py-2.5 font-display font-medium text-white/60 hover:text-white"
                >
                  <SkipForward size={18} />
                  Skip Turn
                </button>
              )}

              <button
                onClick={() => setConfirmAction("end")}
                className="glass-button flex items-center gap-2 px-4 py-2.5 font-display font-medium text-danger/70 hover:text-danger"
                style={{
                  background: "rgba(225, 29, 60, 0.08)",
                  borderColor: "var(--color-accent-danger-muted)",
                }}
              >
                <StopCircle size={18} />
                End
              </button>
            </>
          )}

          <button
            onClick={() => setConfirmAction("reset")}
            className="glass-button flex items-center gap-2 px-4 py-2.5 font-display font-medium text-white/40 hover:text-white/70"
          >
            <RotateCcw size={18} />
            Reset
          </button>
        </div>
      </div>

      {/* Confirm dialogs */}
      <ConfirmDialog
        isOpen={confirmAction === "reset"}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleReset}
        title="Reset Game"
        message="This will remove all teams and reset the game state. This cannot be undone."
        confirmLabel="Reset"
        variant="danger"
      />
      <ConfirmDialog
        isOpen={confirmAction === "end"}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleEnd}
        title="End Game"
        message="Are you sure you want to end the game? Final standings will be recorded."
        confirmLabel="End Game"
        variant="warning"
      />
    </div>
  );
}
