import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, SkipForward, Timer as TimerIcon, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "../ui/dialog";
import { Badge } from "../shared/Badge";
import { useGameStore } from "../../store/useGameStore";
import { useRiddleStore } from "../../store/useRiddleStore";
import { useLogStore } from "../../store/useLogStore";
import { getScorePoints, getMovementBonus, getDifficultyTimer } from "../../lib/scoring";
import { sounds } from "../../lib/sound";
import confetti from "canvas-confetti";
import { toast } from "sonner";

function Timer({ seconds, onTimeout }: { seconds: number; onTimeout: () => void }) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const timeoutFiredRef = useRef(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (!timeoutFiredRef.current) {
        timeoutFiredRef.current = true;
        onTimeout();
      }
      return;
    }
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, onTimeout]);

  const progress = timeLeft / seconds;
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference * (1 - progress);

  const isLow = timeLeft < 10;
  const strokeColor = isLow ? "var(--color-accent-danger)" : "var(--color-accent-primary)";

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 88 88">
          <circle
            cx="44"
            cy="44"
            r="40"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="4"
          />
          <circle
            cx="44"
            cy="44"
            r="40"
            fill="none"
            stroke={strokeColor}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000"
            style={{
              filter: isLow ? 'drop-shadow(0 0 6px rgba(225, 29, 60, 0.5))' : 'none',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`text-lg font-bold font-mono ${
              isLow ? "text-danger" : "text-white"
            }`}
          >
            {timeLeft}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-white/30 text-sm">
        <TimerIcon size={14} />
        <span>seconds</span>
      </div>
    </div>
  );
}

export function RiddleModal() {
  const {
    teams,
    activeTeamId,
    isRiddleOpen,
    setIsRiddleOpen,
    addScore,
    moveTeam,
    recordRiddleAttempt,
    advanceTurn,
  } = useGameStore();

  const { currentRiddle, currentDifficulty, isForcedRiddle, closeRiddle } =
    useRiddleStore();

  const addEntry = useLogStore((s) => s.addEntry);
  const [showAnswer, setShowAnswer] = useState(false);
  const verdictLockRef = useRef(false);

  const currentTeam = teams.find((t) => t.id === activeTeamId);

  // Close the riddle: Radix handles the exit animation via data-state transitions,
  // so we can update state directly without a setTimeout delay.
  const closeRiddleModal = useCallback(() => {
    closeRiddle();
    setIsRiddleOpen(false);
    advanceTurn();
    verdictLockRef.current = false;
  }, [closeRiddle, setIsRiddleOpen, advanceTurn]);

  const handleVerdict = useCallback(
    (isCorrect: boolean) => {
      if (!currentRiddle || !currentDifficulty || !currentTeam) return;
      if (verdictLockRef.current) return;
      verdictLockRef.current = true;

      const scorePoints = getScorePoints(currentDifficulty, isCorrect);
      const movementBonus = getMovementBonus(currentDifficulty, isCorrect);

      recordRiddleAttempt(currentTeam.id, isCorrect);

      if (isCorrect) {
        sounds.correct.play();
        addScore(currentTeam.id, scorePoints);
        const newPosition = currentTeam.position + movementBonus;
        moveTeam(currentTeam.id, newPosition);

        addEntry({
          teamId: currentTeam.id,
          teamName: currentTeam.name,
          message: `answered ${currentDifficulty} riddle correctly (${scorePoints} pts, +${movementBonus} cells)`,
          type: "riddle",
        });

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#4C8DFF", "#C6F135", "#FFB830", "#E11D3C"],
        });

        toast.success(`${currentTeam.name} got it right! +${scorePoints} pts`);
      } else {
        sounds.incorrect.play();
        addScore(currentTeam.id, scorePoints);
        const newPosition = Math.max(0, currentTeam.position + movementBonus);
        moveTeam(currentTeam.id, newPosition);

        addEntry({
          teamId: currentTeam.id,
          teamName: currentTeam.name,
          message: `answered ${currentDifficulty} riddle incorrectly (${scorePoints} pts, ${movementBonus} cells)`,
          type: "riddle",
        });

        toast.error(`${currentTeam.name} got it wrong`);
      }

      closeRiddleModal();
    },
    [
      currentRiddle,
      currentDifficulty,
      currentTeam,
      recordRiddleAttempt,
      addScore,
      moveTeam,
      addEntry,
      closeRiddleModal,
    ]
  );

  const handleSkip = useCallback(() => {
    if (!currentTeam) return;
    if (verdictLockRef.current) return;
    verdictLockRef.current = true;

    addEntry({
      teamId: currentTeam.id,
      teamName: currentTeam.name,
      message: "skipped the riddle (judge override)",
      type: "riddle",
    });

    closeRiddleModal();
  }, [currentTeam, addEntry, closeRiddleModal]);

  const handleTimeout = useCallback(() => {
    handleVerdict(false);
  }, [handleVerdict]);

  // Dialog open state managed by our store — Radix reads `open` prop
  // Since we prevent Esc and outside interaction, the only way the dialog closes
  // is via closeRiddleModal() which already handles all state. This handler
  // is a safety net to sync store state if Radix closes for any other reason.
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && !verdictLockRef.current) {
        // Don't call closeRiddle() here — closeRiddleModal() already handles it.
        // Just sync the isRiddleOpen state as a safety net.
        setIsRiddleOpen(false);
      }
    },
    [setIsRiddleOpen]
  );

  // Keyboard shortcuts (C = correct, X = incorrect, S = skip)
  useEffect(() => {
    if (!isRiddleOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key === "c" || e.key === "C") handleVerdict(true);
      else if (e.key === "x" || e.key === "X") handleVerdict(false);
      else if (e.key === "s" || e.key === "S") handleSkip();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRiddleOpen, handleVerdict, handleSkip]);

  if (!currentRiddle || !currentDifficulty || !currentTeam) return null;

  const timerSeconds = getDifficultyTimer(currentDifficulty);

  return (
    <Dialog
      open={isRiddleOpen}
      onOpenChange={handleOpenChange}
    >
      <DialogContent
        size="lg"
        preventEscape={true}
        preventOutsideInteraction={true}
        className="max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>
            {isForcedRiddle ? "⚠ Forced Riddle" : "Riddle Challenge"}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-6">
            {/* Forced riddle banner */}
            {isForcedRiddle && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel p-3 text-center animate-forced-alarm"
                style={{
                  background: 'rgba(225, 29, 60, 0.08)',
                  borderColor: 'rgba(225, 29, 60, 0.3)',
                }}
              >
                <span className="text-danger font-display font-bold text-sm">
                  ⚠ Forced Riddle — {currentTeam?.name} must attempt this riddle!
                </span>
              </motion.div>
            )}

            {/* Team info and difficulty */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-sm"
                  style={{
                    backgroundColor: currentTeam.color + "20",
                    border: `1px solid ${currentTeam.color}40`,
                    color: currentTeam.color,
                  }}
                >
                  {currentTeam.name.charAt(0)}
                </div>
                <div>
                  <p className="text-white font-display font-medium">
                    {currentTeam.name}
                  </p>
                  <p className="text-white/40 text-sm">Current turn</p>
                </div>
              </div>
              <Badge variant={currentDifficulty} size="lg">
                {currentDifficulty.toUpperCase()}
              </Badge>
            </div>

            {/* Timer */}
            <div className="flex justify-center">
              <Timer seconds={timerSeconds} onTimeout={handleTimeout} />
            </div>

            {/* Riddle */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-panel p-6"
            >
              <p className="text-xl text-white font-medium text-center leading-relaxed">
                {currentRiddle.question}
              </p>
            </motion.div>

            {/* Show Answer toggle */}
            <div className="flex justify-center">
              <button
                onClick={() => setShowAnswer(!showAnswer)}
                className="flex items-center gap-2 text-sm text-white/30 hover:text-white/50 transition-colors"
              >
                {showAnswer ? <EyeOff size={14} /> : <Eye size={14} />}
                {showAnswer ? "Hide answer" : "Show answer"}
              </button>
            </div>

            <AnimatePresence>
              {showAnswer && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="glass-panel overflow-hidden"
                  style={{
                    background: 'rgba(255, 184, 48, 0.06)',
                    borderColor: 'var(--color-accent-gold-muted)',
                  }}
                >
                  <div className="p-4">
                    <p className="text-accent-gold text-center font-display font-medium">
                      Answer: {currentRiddle.answer}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Verdict Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex gap-4 pt-2"
            >
              <button
                onClick={() => handleVerdict(true)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-display font-bold text-lg text-white transition-all hover:scale-[1.02] active:scale-95"
                style={{
                  background: 'var(--color-accent-success-muted)',
                  border: '1px solid rgba(198, 241, 53, 0.3)',
                  boxShadow: '0 8px 30px -8px rgba(198, 241, 53, 0.2)',
                }}
              >
                <Check size={24} />
                Correct
              </button>
              <button
                onClick={() => handleVerdict(false)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-display font-bold text-lg text-white transition-all hover:scale-[1.02] active:scale-95"
                style={{
                  background: 'var(--color-accent-danger-muted)',
                  border: '1px solid rgba(225, 29, 60, 0.3)',
                  boxShadow: '0 8px 30px -8px rgba(225, 29, 60, 0.2)',
                }}
              >
                <X size={24} />
                Incorrect
              </button>
            </motion.div>

            {/* Skip option */}
            <div className="flex justify-center">
              <button
                onClick={handleSkip}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white/30 hover:text-white/50 transition-colors"
              >
                <SkipForward size={16} />
                Skip / Re-roll
              </button>
            </div>

            {/* Keyboard shortcuts hint */}
            <p className="text-center text-white/20 text-xs font-mono">
              <kbd className="px-1.5 py-0.5 rounded bg-white/[0.04] text-white/40">C</kbd> Correct ·{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-white/[0.04] text-white/40">X</kbd> Incorrect ·{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-white/[0.04] text-white/40">S</kbd> Skip
            </p>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
