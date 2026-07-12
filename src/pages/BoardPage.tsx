import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameBoard3D } from "../components/board/GameBoard3D";
import { DicePanel } from "../components/dice/DicePanel";
import { RiddleModal } from "../components/riddles/RiddleModal";
import { LeaderboardTable } from "../components/leaderboard/LeaderboardTable";
import { GameControlBar } from "../components/controls/GameControlBar";
import { ActionLog } from "../components/controls/ActionLog";
import { useGameStore } from "../store/useGameStore";
import { useDiceRoll } from "../hooks/useDiceRoll";
import { useForcedRiddle } from "../hooks/useForcedRiddle";
import { useRiddleStore } from "../store/useRiddleStore";
import { boardCells } from "../data/boardConfig";
import { saveMatchResult } from "../lib/leaderboardHistoryService";
import { useLeaderboardHistoryStore } from "../store/useLeaderboardHistoryStore";
import { Trophy, Crown, Medal, Award, Download, RotateCcw, Share2, Minimize2, ChevronUp, PanelRightClose, PanelRightOpen } from "lucide-react";
import { Button } from "../components/ui/button";
import confetti from "canvas-confetti";
import { toast } from "sonner";

function VictoryScreen() {
  const { teams, winner, setGamePhase, setWinner } = useGameStore();

  const sortedTeams = [...teams].sort((a, b) => {
    if (b.position !== a.position) return b.position - a.position;
    return b.score - a.score;
  });

  const handleExport = () => {
    const data = sortedTeams.map((t, i) => ({
      rank: i + 1,
      name: t.name,
      participants: t.participants.map((p) => p.name).join(" & "),
      score: t.score,
      position: t.position + 1,
      riddlesAttempted: t.riddlesAttempted,
      riddlesCorrect: t.riddlesCorrect,
      riddlesIncorrect: t.riddlesIncorrect,
    }));

    const csv = [
      ["Rank", "Team", "Participants", "Score", "Position", "Riddles", "Correct", "Incorrect"],
      ...data.map((d) => [d.rank, d.name, d.participants, d.score, d.position, d.riddlesAttempted, d.riddlesCorrect, d.riddlesIncorrect]),
    ].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `riddle-rush-results-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Results exported as CSV");
  };

  const handleShare = async () => {
    const lines: string[] = [];
    lines.push("Riddle Rush — Final Results");
    lines.push("");

    sortedTeams.forEach((t, i) => {
      const badge = i === 0 ? "[1st]" : i === 1 ? "[2nd]" : i === 2 ? "[3rd]" : `[#${i + 1}]`;
      const rate = t.riddlesAttempted > 0
        ? `${Math.round((t.riddlesCorrect / t.riddlesAttempted) * 100)}% correct`
        : "no riddles";
      lines.push(`${badge}  ${t.name} — ${t.score} pts, cell ${t.position + 1}, ${rate}`);
    });

    lines.push("");
    lines.push("Play at riddle-rush.app");

    const text = lines.join("\n");

    // Try Web Share API first (mobile-friendly)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Riddle Rush Results",
          text,
        });
        return;
      } catch (err) {
        // User cancelled — don't show error toast
        if ((err as Error).name === "AbortError") return;
        // Otherwise fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Results copied to clipboard!");
    } catch {
      toast.error("Could not share results");
    }
  };

  const handlePlayAgain = () => {
    for (const team of teams) {
      useGameStore.getState().updateTeam(team.id, {
        position: 0,
        score: 0,
        riddlesAttempted: 0,
        riddlesCorrect: 0,
        riddlesIncorrect: 0,
        consecutiveNonRiddleTurns: 0,
        totalTurns: 0,
        scoreHistory: [0],
      });
    }
    setWinner(null);
    useGameStore.getState().setCurrentTeamIndex(0);
    const firstTeam = teams[0];
    if (firstTeam) {
      useGameStore.getState().setActiveTeamId(firstTeam.id);
    }
    useGameStore.getState().setResultsSaved(false);
    setGamePhase("active");
  };

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

        <h2 className="text-3xl font-display font-bold text-white mb-2 flex items-center justify-center gap-3">
          <Trophy size={28} className="text-accent-gold" />
          Game Over!
        </h2>
        {winner && (
          <p className="text-accent-gold text-lg font-display font-medium mb-6">
            {winner.name} wins with {winner.score} points!
          </p>
        )}

        <div className="space-y-3 mb-8">
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
                {i === 0 ? <Crown size={20} /> : i === 1 ? <Medal size={20} /> : i === 2 ? <Award size={20} /> : `#${i + 1}`}
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-display font-semibold">{team.name}</p>
                <p className="text-fg-muted text-xs font-mono">
                  {team.riddlesCorrect}/{team.riddlesAttempted} riddles correct
                </p>
              </div>
              <div className="text-right">
                <p className="text-white font-mono font-bold text-xl">{team.score}</p>
                <p className="text-fg-subtle text-xs font-mono">pts</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-3 justify-center flex-wrap">
          <Button
            onClick={handleShare}
            variant="secondary"
            aria-label="Share results via system share or clipboard"
          >
            <Share2 size={18} />
            Share
          </Button>
          <Button
            onClick={handleExport}
            variant="secondary"
          >
            <Download size={18} />
            Export CSV
          </Button>
          <Button
            onClick={handlePlayAgain}
            variant="primary"
            size="lg"
          >
            <RotateCcw size={18} />
            Play Again
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function BoardPage() {
  const {
    teams,
    gamePhase,
    currentTeamIndex,
    isRolling,
    setIsRiddleOpen,
    advanceTurn,
    winner,
  } = useGameStore();

  const { drawRiddle } = useRiddleStore();
  const isForcedRiddle = useRiddleStore((s) => s.isForcedRiddle);
  const forcedCurrentRiddle = useRiddleStore((s) => s.currentRiddle);
  const { roll, isAnimating } = useDiceRoll();
  const { checkAndTriggerForcedRiddle } = useForcedRiddle();
  const rollInProgress = useRef(false);
  const [showSidePanel, setShowSidePanel] = useState(false);

  const currentTeam = teams[currentTeamIndex];

  const handleRoll = useCallback(async () => {
    if (rollInProgress.current || gamePhase !== "active" || !currentTeam || isRolling || isAnimating)
      return;

    rollInProgress.current = true;
    const result = await roll();

    if (result) {
      const landingCell = boardCells[Math.min(result.newPosition, 31)];

      const isForced = checkAndTriggerForcedRiddle();

      if (!isForced && landingCell?.type === "riddle" && landingCell.difficulty) {
        setTimeout(() => {
          drawRiddle(landingCell.difficulty!, Math.random() < 0.5 ? "tech" : "non-tech");
          setIsRiddleOpen(true);
        }, 500);
      } else if (isForced) {
        setTimeout(() => {
          setIsRiddleOpen(true);
        }, 500);
      } else {
        setTimeout(() => {
          advanceTurn();
        }, 1000);
      }
    }

    rollInProgress.current = false;
  }, [roll, gamePhase, currentTeam, isRolling, isAnimating, checkAndTriggerForcedRiddle, drawRiddle, setIsRiddleOpen, advanceTurn]);

  useEffect(() => {
    if (isForcedRiddle && forcedCurrentRiddle) {
      setIsRiddleOpen(true);
    }
  }, [isForcedRiddle, forcedCurrentRiddle, setIsRiddleOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "r" || e.key === "R") {
        if (gamePhase === "active" && !useGameStore.getState().isRolling && !useGameStore.getState().isRiddleOpen) {
          handleRoll();
        }
      }
      if (e.key === " ") {
        e.preventDefault();
        const state = useGameStore.getState();
        if (state.gamePhase === "active") {
          state.setGamePhase("paused");
        } else if (state.gamePhase === "paused") {
          state.setGamePhase("active");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gamePhase, handleRoll]);

  useEffect(() => {
    if (gamePhase === "ended") {
      confetti({ particleCount: 300, spread: 180, origin: { y: 0.3 } });
    }
  }, [gamePhase]);

  // ─── Record match to persistent history on game end ───
  const resultsSaved = useGameStore((s) => s.resultsSaved);
  const gameMode = useGameStore((s) => s.gameMode);
  useEffect(() => {
    if (gamePhase === "ended" && teams.length > 0 && !resultsSaved) {
      saveMatchResult(teams, gameMode).then(() => {
        useGameStore.getState().setResultsSaved(true);
        useLeaderboardHistoryStore.getState().loadHistory();
      });
    }
  }, [gamePhase, teams, resultsSaved, gameMode]);

  const [boardFullscreen, setBoardFullscreen] = useState(() => {
    try {
      const stored = localStorage.getItem("riddle-rush-board-fullscreen");
      return stored === "true";
    } catch {
      return false;
    }
  });
  const isDisabled = isRolling || gamePhase !== "active" || teams.length === 0;

  const toggleFullscreen = useCallback(() => {
    setBoardFullscreen((prev) => !prev);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("riddle-rush-board-fullscreen", String(boardFullscreen));
    } catch {
      // localStorage may be unavailable
    }
  }, [boardFullscreen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "f" || e.key === "F") {
        setBoardFullscreen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // ─── Immersive Fullscreen Mode ───
  if (boardFullscreen) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="fixed inset-0 z-50 bg-ink-900"
      >
        <AnimatePresence>
          {gamePhase === "ended" && winner && <VictoryScreen />}
        </AnimatePresence>

        {/* Fullscreen board — fills entire viewport */}
        <div className="absolute inset-0">
          <GameBoard3D onToggleFullscreen={toggleFullscreen} isFullscreen={true} />
        </div>

        {/* Immersive dice cluster — bottom-center, floating glass panel */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3, ease: "easeOut" }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30"
        >
          <DicePanel onRoll={handleRoll} isDisabled={isDisabled} variant="floating" />
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

        <RiddleModal />
      </motion.div>
    );
  }

  // ─── Normal Mode ───
  return (
    <div className="min-h-full flex flex-col"
      style={{
        background: [
          "radial-gradient(ellipse at 30% 20%, rgba(47, 217, 168, 0.06) 0%, transparent 60%)",
          "radial-gradient(ellipse at 70% 80%, rgba(255, 184, 48, 0.03) 0%, transparent 50%)",
          "var(--color-bg-base)",
        ].join(", "),
      }}>
      <AnimatePresence>
        {gamePhase === "ended" && winner && <VictoryScreen />}
      </AnimatePresence>

      {/* Sticky control bar */}
      <div className="sticky top-0 z-40 backdrop-blur-lg border-b border-white/[0.04] flex-shrink-0"
        style={{ background: "var(--color-bg-header)" }}>
        <div className="p-3 px-5">
          <GameControlBar />
        </div>
      </div>

      {/* Main layout: viewport with overlays */}
      <div className="flex-1 relative min-h-0">
        {/* 3D Board viewport — fills available space */}
        <div className="absolute inset-0">
          <div className="h-full rounded-2xl overflow-hidden glass-panel p-1 m-6">
            <div className="w-full h-full min-h-[400px] rounded-xl overflow-hidden">
              <GameBoard3D onToggleFullscreen={toggleFullscreen} />
            </div>
          </div>
        </div>

        {/* ─── Overlaid HUD: Primary actions (dice/roll) — bottom-center ─── */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 hidden lg:block">
          <DicePanel onRoll={handleRoll} isDisabled={isDisabled} variant="floating" />
        </div>

        {/* Mobile dice panel — bottom-center, always visible on small screens */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 lg:hidden">
          <DicePanel onRoll={handleRoll} isDisabled={isDisabled} variant="compact" />
        </div>

        {/* ─── Toggle side panel button (top-left to avoid overlapping board controls) ─── */}
        <button
          onClick={() => setShowSidePanel(!showSidePanel)}
          className={`absolute top-4 left-1/2 -translate-x-1/2 z-30 glass-button px-3 py-2 flex items-center gap-2 transition-all ${
            showSidePanel ? "text-jade border-jade/30" : "text-white/50 hover:text-white"
          }`}
          aria-label={showSidePanel ? "Close stats panel" : "Open stats panel"}
        >
          {showSidePanel ? (
            <PanelRightClose size={16} aria-hidden="true" />
          ) : (
            <PanelRightOpen size={16} aria-hidden="true" />
          )}
          <span className="text-xs font-display font-medium hidden sm:inline">
            {showSidePanel ? "Hide Stats" : "Show Stats"}
          </span>
        </button>

        {/* ─── Side panel: Leaderboard + Action Log (desktop only) ─── */}
        <AnimatePresence>
          {showSidePanel && (
            <motion.div
              initial={{ x: 380, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 380, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute top-6 right-6 z-20 w-[380px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-8rem)] overflow-y-auto hidden lg:block"
              style={{ paddingTop: "3rem" }}
            >
              <div className="flex flex-col gap-6 pr-1">
                <LeaderboardTable />
                <ActionLog />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Mobile bottom drawer for stats ─── */}
        <AnimatePresence>
          {showSidePanel && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-30 lg:hidden"
              style={{ maxHeight: "60vh" }}
            >
              <div className="relative rounded-t-2xl overflow-hidden"
                style={{ background: "var(--color-bg-elevated)", borderTop: "1px solid var(--color-glass-border)" }}>
                {/* Handle */}
                <button
                  onClick={() => setShowSidePanel(false)}
                  className="w-full flex justify-center pt-3 pb-2 text-white/30 hover:text-white/50"
                  aria-label="Close stats panel"
                >
                  <ChevronUp size={20} />
                </button>
                <div className="px-4 pb-6 max-h-[55vh] overflow-y-auto space-y-4">
                  <LeaderboardTable />
                  <ActionLog />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <RiddleModal />
    </div>
  );
}
