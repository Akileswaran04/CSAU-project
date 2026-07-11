import { RULES } from "../data/boardConfig";

/**
 * Riddle Rush Scoring Rules
 * =========================
 *
 * SCORING:
 * - Correct Answer (Easy):    +10 points, +2 cells forward
 * - Correct Answer (Medium):  +20 points, +3 cells forward
 * - Correct Answer (Hard):    +35 points, +4 cells forward
 * - Incorrect Answer (Easy):   +0 points, -1 cell backward (min 0)
 * - Incorrect Answer (Medium): -5 points (min 0), -2 cells backward (min 0)
 * - Incorrect Answer (Hard):  -10 points (min 0), -3 cells backward (min 0)
 *
 * GAME RULES:
 * - Forced Riddle: After 4 consecutive non-riddle landings, team MUST attempt a riddle
 * - Board: 32 cells in snake layout
 * - Dice: 6-sided, rolled each turn
 * - First team to reach/exceed the final cell wins
 * - If multiple teams reach the end, highest score wins
 */

export type Difficulty = "easy" | "medium" | "hard";

export function getScorePoints(
  difficulty: Difficulty,
  isCorrect: boolean
): number {
  return isCorrect
    ? RULES.scorePoints.correct[difficulty]
    : RULES.scorePoints.incorrect[difficulty];
}

export function getMovementBonus(
  difficulty: Difficulty,
  isCorrect: boolean
): number {
  return isCorrect
    ? RULES.riddleBonusMovement[difficulty]
    : RULES.riddlePenaltyMovement[difficulty];
}

export function clampPosition(position: number, min = 0, max = 31): number {
  return Math.max(min, Math.min(max, position));
}

export function getDifficultyTimer(difficulty: Difficulty): number {
  return RULES.timerSeconds[difficulty];
}
