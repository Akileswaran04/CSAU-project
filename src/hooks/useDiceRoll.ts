import { useState, useCallback } from "react";
import { useGameStore } from "../store/useGameStore";
import { useLogStore } from "../store/useLogStore";
import { sounds } from "../lib/sound";

export function useDiceRoll() {
  const [isAnimating, setIsAnimating] = useState(false);
  const { teams, currentTeamIndex, setDiceResult, setIsRolling, moveTeam, incrementNonRiddleTurns } =
    useGameStore();
  const addEntry = useLogStore((s) => s.addEntry);

  const roll = useCallback(async () => {
    const team = teams[currentTeamIndex];
    if (!team || isAnimating) return;

    setIsAnimating(true);
    setIsRolling(true);

    sounds.diceRoll.play();

    await new Promise((resolve) => setTimeout(resolve, 1200));

    const result = Math.floor(Math.random() * 6) + 1;
    setDiceResult(result);

    addEntry({
      teamId: team.id,
      teamName: team.name,
      message: `rolled a ${result}`,
      type: "roll",
    });

    const newPosition = team.position + result;

    // Position updates NOW — triggers step-by-step token animation
    moveTeam(team.id, newPosition);

    incrementNonRiddleTurns(team.id);

    addEntry({
      teamId: team.id,
      teamName: team.name,
      message: `moved from cell ${team.position} to cell ${Math.min(newPosition, 31)}`,
      type: "movement",
    });

    // Small gap for the overshoot to commit, then settle fires
    await new Promise((resolve) => setTimeout(resolve, 100));

    setIsRolling(false);
    setIsAnimating(false);

    return { result, newPosition: Math.min(newPosition, 31) };
  }, [teams, currentTeamIndex, isAnimating, setDiceResult, setIsRolling, moveTeam, incrementNonRiddleTurns, addEntry]);

  return { roll, isAnimating };
}
