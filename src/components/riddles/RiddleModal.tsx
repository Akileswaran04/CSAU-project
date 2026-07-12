import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, SkipForward, Timer as TimerIcon, Cpu, BookOpen, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "../ui/dialog";
import { Badge } from "../shared/Badge";
import { Button } from "../ui/button";
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

type SubmissionState = "idle" | "submitted" | "timeout";

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
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const verdictLockRef = useRef(false);

  const currentTeam = teams.find((t) => t.id === activeTeamId);

  // Reset state when riddle opens
  useEffect(() => {
    if (isRiddleOpen) {
      setSelectedIndex(null);
      setSubmissionState("idle");
      verdictLockRef.current = false;
    }
  }, [isRiddleOpen]);

  const applyVerdict = useCallback(
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
    },
    [currentRiddle, currentDifficulty, currentTeam, recordRiddleAttempt, addScore, moveTeam, addEntry]
  );

  const handleSubmit = useCallback(() => {
    if (!currentRiddle) return;
    if (verdictLockRef.current) return;
    if (selectedIndex === null) return;

    setSubmissionState("submitted");
    const isCorrect = selectedIndex === currentRiddle.correctIndex;
    applyVerdict(isCorrect);
  }, [currentRiddle, selectedIndex, applyVerdict]);

  const handleTimeout = useCallback(() => {
    if (verdictLockRef.current) return;
    setSubmissionState("timeout");
    applyVerdict(false);
  }, [applyVerdict]);

  const handleContinue = useCallback(() => {
    closeRiddle();
    setIsRiddleOpen(false);
    advanceTurn();
  }, [closeRiddle, setIsRiddleOpen, advanceTurn]);

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

    closeRiddle();
    setIsRiddleOpen(false);
    advanceTurn();
  }, [currentTeam, addEntry, closeRiddle, setIsRiddleOpen, advanceTurn]);

  // Dialog open state managed by our store — Radix reads `open` prop
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && !verdictLockRef.current) {
        setIsRiddleOpen(false);
      }
    },
    [setIsRiddleOpen]
  );

  // Keyboard shortcuts (1-4 for options, Enter to submit)
  useEffect(() => {
    if (!isRiddleOpen || submissionState !== "idle") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key >= "1" && e.key <= "4") {
        setSelectedIndex(parseInt(e.key) - 1);
      } else if (e.key === "Enter" && selectedIndex !== null) {
        handleSubmit();
      } else if (e.key === "s" || e.key === "S") {
        handleSkip();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRiddleOpen, submissionState, selectedIndex, handleSubmit, handleSkip]);

  if (!currentRiddle || !currentDifficulty || !currentTeam) return null;

  const timerSeconds = getDifficultyTimer(currentDifficulty);
  const hasSubmitted = submissionState !== "idle";
  const isCorrect = hasSubmitted && selectedIndex === currentRiddle.correctIndex;
  const isTimedOut = submissionState === "timeout";

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
                  <p className="text-fg-muted text-sm">Current turn</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Category badge */}
                <div
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-display font-semibold uppercase tracking-wider"
                  style={{
                    background: currentRiddle.category === "tech"
                      ? "rgba(76, 141, 255, 0.12)"
                      : "rgba(198, 241, 53, 0.12)",
                    color: currentRiddle.category === "tech"
                      ? "var(--color-accent-primary)"
                      : "var(--color-accent-success)",
                    border: `1px solid ${
                      currentRiddle.category === "tech"
                        ? "rgba(76, 141, 255, 0.25)"
                        : "rgba(198, 241, 53, 0.25)"
                    }`,
                  }}
                >
                  {currentRiddle.category === "tech" ? (
                    <Cpu size={12} />
                  ) : (
                    <BookOpen size={12} />
                  )}
                  {currentRiddle.category === "tech" ? "Tech" : "Wordplay"}
                </div>
                <Badge variant={currentDifficulty} size="lg">
                  {currentDifficulty.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Timer (only show during active answering) */}
            {!hasSubmitted && (
              <div className="flex justify-center">
                <Timer seconds={timerSeconds} onTimeout={handleTimeout} />
              </div>
            )}

            {/* Riddle question */}
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

            {/* MCQ Options */}
            <div className="space-y-3">
              {currentRiddle.options.map((option, idx) => {
                let optionStyle: React.CSSProperties = {};
                let icon: React.ReactNode = null;
                let isSelected = selectedIndex === idx;

                if (hasSubmitted) {
                  if (idx === currentRiddle.correctIndex) {
                    // Correct answer — always highlight green
                    optionStyle = {
                      background: "rgba(63, 191, 127, 0.12)",
                      borderColor: "rgba(63, 191, 127, 0.4)",
                    };
                    icon = <Check size={18} className="text-accent-success shrink-0" />;
                  } else if (isSelected) {
                    // Wrong selection — highlight red
                    optionStyle = {
                      background: "rgba(229, 72, 77, 0.12)",
                      borderColor: "rgba(229, 72, 77, 0.4)",
                    };
                    icon = <X size={18} className="text-danger shrink-0" />;
                  } else {
                    // Other options — dim
                    optionStyle = {
                      opacity: 0.35,
                    };
                  }
                } else if (isSelected) {
                  optionStyle = {
                    background: "var(--color-accent-primary-muted)",
                    borderColor: "var(--color-accent-primary)",
                  };
                }

                return (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.05 }}
                    onClick={() => {
                      if (!hasSubmitted) setSelectedIndex(idx);
                    }}
                    disabled={hasSubmitted}
                    className="w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all duration-200 cursor-pointer disabled:cursor-default"
                    style={{
                      background: optionStyle.background || "var(--color-glass-white-03)",
                      border: `1px solid ${optionStyle.borderColor || "var(--color-glass-white-06)"}`,
                      opacity: optionStyle.opacity ?? 1,
                    }}
                  >
                    {/* Option letter */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0"
                      style={{
                        background: hasSubmitted
                          ? idx === currentRiddle.correctIndex
                            ? "rgba(63, 191, 127, 0.2)"
                            : isSelected
                              ? "rgba(229, 72, 77, 0.2)"
                              : "var(--color-glass-white-06)"
                          : isSelected
                            ? "var(--color-accent-primary-muted)"
                            : "var(--color-glass-white-06)",
                        color: hasSubmitted && idx === currentRiddle.correctIndex
                          ? "var(--color-accent-success)"
                          : hasSubmitted && isSelected
                            ? "var(--color-accent-danger)"
                            : isSelected
                              ? "var(--color-accent-primary)"
                              : "var(--color-fg-muted)",
                      }}
                    >
                      {["A", "B", "C", "D"][idx]}
                    </div>
                    <span className="flex-1 text-sm text-white font-display font-medium">
                      {option}
                    </span>
                    {icon}
                  </motion.button>
                );
              })}
            </div>

            {/* Result + Answer reveal */}
            <AnimatePresence>
              {hasSubmitted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Result banner */}
                  <div
                    className="glass-panel p-4 text-center"
                    style={{
                      background: isCorrect
                        ? "rgba(63, 191, 127, 0.08)"
                        : isTimedOut
                          ? "rgba(242, 153, 74, 0.08)"
                          : "rgba(229, 72, 77, 0.08)",
                      borderColor: isCorrect
                        ? "rgba(63, 191, 127, 0.2)"
                        : isTimedOut
                          ? "rgba(242, 153, 74, 0.2)"
                          : "rgba(229, 72, 77, 0.2)",
                    }}
                  >
                    <p
                      className="text-lg font-display font-bold"
                      style={{
                        color: isCorrect
                          ? "var(--color-accent-success)"
                          : isTimedOut
                            ? "var(--color-alert-amber)"
                            : "var(--color-accent-danger)",
                      }}
                    >
                      {isTimedOut
                        ? "⏰ Time's Up!"
                        : isCorrect
                          ? "🎉 Correct!"
                          : "❌ Incorrect"}
                    </p>
                  </div>

                  {/* Answer explanation */}
                  <div
                    className="glass-panel p-4"
                    style={{
                      background: "rgba(255, 184, 48, 0.06)",
                      borderColor: "var(--color-accent-gold-muted)",
                    }}
                  >
                    <p className="text-accent-gold text-sm font-display font-medium mb-1">
                      Answer: {currentRiddle.options[currentRiddle.correctIndex]}
                    </p>
                    <p className="text-white/50 text-sm font-display leading-relaxed">
                      {currentRiddle.answer}
                    </p>
                  </div>

                  {/* Continue button */}
                  <div className="flex justify-center pt-2">
                    <Button
                      onClick={handleContinue}
                      variant="primary"
                      size="lg"
                      className="px-8"
                    >
                      <ArrowRight size={18} />
                      Continue
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit button (only when not submitted) */}
            {!hasSubmitted && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col items-center gap-3 pt-2"
              >
                <Button
                  onClick={handleSubmit}
                  variant="primary"
                  size="lg"
                  className="w-full py-4 text-lg font-bold hover:scale-[1.02] active:scale-95"
                  disabled={selectedIndex === null}
                >
                  <Check size={24} />
                  Submit Answer
                </Button>

                {/* Skip option */}
                <Button
                  onClick={handleSkip}
                  variant="ghost"
                  size="sm"
                >
                  <SkipForward size={16} />
                  Skip / Re-roll
                </Button>
              </motion.div>
            )}

            {/* Keyboard shortcuts hint */}
            {!hasSubmitted && (
              <p className="text-center text-fg-faint text-xs font-mono">
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.04] text-fg-subtle">1-4</kbd> Select ·{" "}
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.04] text-fg-subtle">Enter</kbd> Submit ·{" "}
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.04] text-fg-subtle">S</kbd> Skip
              </p>
            )}
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
