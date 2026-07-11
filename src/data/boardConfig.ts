export interface CellConfig {
  index: number;
  type: "normal" | "riddle" | "start" | "end";
  difficulty?: "easy" | "medium" | "hard";
  position: { x: number; z: number };
  row: number;
  col: number;
}

// Board constants
const TOTAL_CELLS = 32;
const CELL_SPACING = 2.4;
const COLS_PER_ROW = 8;
const ROWS = 4;

/**
 * Generate a serpentine (snake) board layout.
 *
 * 32 cells arranged in 4 rows of 8, alternating direction each row:
 *   Row 0 (bottom):  cells 0-7  → left to right  (z=0,  x increases)
 *   Row 1:           cells 8-15 → right to left   (z=1,  x decreases)
 *   Row 2:           cells 16-23 → left to right  (z=2,  x increases)
 *   Row 3 (top):     cells 24-31 → right to left  (z=3,  x decreases)
 *
 * The board is centered so the midpoint sits at x=0, z=~2.7 for nice camera framing.
 */
export function generateBoard(): CellConfig[] {
  const cells: CellConfig[] = [];
  const rowWidth = (COLS_PER_ROW - 1) * CELL_SPACING;

  for (let i = 0; i < TOTAL_CELLS; i++) {
    const row = Math.floor(i / COLS_PER_ROW);
    const col = i % COLS_PER_ROW;

    // Even rows go left→right, odd rows go right→left
    const isEvenRow = row % 2 === 0;
    const effectiveCol = isEvenRow ? col : (COLS_PER_ROW - 1 - col);

    // Center the board so x spans from -rowWidth/2 to +rowWidth/2
    const x = effectiveCol * CELL_SPACING - rowWidth / 2;
    const z = row * CELL_SPACING;

    let type: CellConfig["type"] = "normal";
    let difficulty: CellConfig["difficulty"] = undefined;

    if (i === 0) {
      type = "start";
    } else if (i === TOTAL_CELLS - 1) {
      type = "end";
    } else {
      // Riddle squares — same indices as before (every 3rd cell, cycling difficulty)
      const riddlePositions = new Set([3, 6, 9, 12, 15, 18, 21, 24, 27, 30]);
      const difficultyMap: Record<number, "easy" | "medium" | "hard"> = {
        3: "easy",   6: "medium",  9: "hard",
        12: "easy",  15: "medium", 18: "hard",
        21: "easy",  24: "medium", 27: "hard",
        30: "easy",
      };

      if (riddlePositions.has(i)) {
        type = "riddle";
        difficulty = difficultyMap[i];
      }
    }

    cells.push({
      index: i,
      type,
      difficulty,
      position: { x, z },
      row,
      col: effectiveCol,
    });
  }

  return cells;
}

export const boardCells: CellConfig[] = generateBoard();

export const BOARD_SIZE = boardCells.length;

export interface DiceConfig {
  sides: 6;
}

export const RULES = {
  cellsPerRow: COLS_PER_ROW,
  rows: ROWS,
  totalCells: TOTAL_CELLS,
  riddleBonusMovement: {
    easy: 2,
    medium: 3,
    hard: 4,
  },
  riddlePenaltyMovement: {
    easy: -1,
    medium: -2,
    hard: -3,
  },
  scorePoints: {
    correct: {
      easy: 10,
      medium: 20,
      hard: 35,
    },
    incorrect: {
      easy: 0,
      medium: -5,
      hard: -10,
    },
  },
  forcedRiddleThreshold: 4,
  timerSeconds: {
    easy: 45,
    medium: 60,
    hard: 90,
  },
};
