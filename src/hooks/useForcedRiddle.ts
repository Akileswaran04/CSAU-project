import { useCallback } from "react";
import { useGameStore } from "../store/useGameStore";
import { useRiddleStore } from "../store/useRiddleStore";
import { useLogStore } from "../store/useLogStore";
import { RULES } from "../data/boardConfig";
import { sounds } from "../lib/sound";
import { toast } from "sonner";

export function useForcedRiddle() {
  const { teams, currentTeamIndex } = useGameStore();
  const { drawRiddle, setIsForcedRiddle, setForcedTeamId } = useRiddleStore();
  const addEntry = useLogStore((s) => s.addEntry);

  const checkAndTriggerForcedRiddle = useCallback(() => {
    const team = teams[currentTeamIndex];
    if (!team) return false;

    if (team.consecutiveNonRiddleTurns >= RULES.forcedRiddleThreshold) {
      sounds.forcedRiddle.play();

      toast.warning(`⚠ Forced Riddle Activated — ${team.name} must attempt a riddle!`, {
        duration: 6000,
        position: "top-center",
      });

      addEntry({
        teamId: team.id,
        teamName: team.name,
        message: `FORCED RIDDLE triggered — must attempt a riddle!`,
        type: "forced",
      });

      setIsForcedRiddle(true);
      setForcedTeamId(team.id);

      const difficulties: Array<"easy" | "medium" | "hard"> = ["easy", "medium", "hard"];
      const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
      // For forced riddles, pick random category 50/50
      drawRiddle(randomDifficulty, Math.random() < 0.5 ? "tech" : "non-tech");

      return true;
    }

    return false;
  }, [teams, currentTeamIndex, drawRiddle, setIsForcedRiddle, setForcedTeamId, addEntry]);

  const getForcedRiddleProgress = useCallback(
    (teamId: string): { current: number; threshold: number } => {
      const team = teams.find((t) => t.id === teamId);
      if (!team) return { current: 0, threshold: RULES.forcedRiddleThreshold };
      return {
        current: team.consecutiveNonRiddleTurns,
        threshold: RULES.forcedRiddleThreshold,
      };
    },
    [teams]
  );

  return { checkAndTriggerForcedRiddle, getForcedRiddleProgress };
}
