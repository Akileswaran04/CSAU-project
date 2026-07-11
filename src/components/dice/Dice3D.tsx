import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "../../store/useGameStore";
import { createResultPopTimeline } from "../../lib/animations";

// Dot layout for each dice face
const dotPositions: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [[-1, -1], [1, 1]],
  3: [[-1, -1], [0, 0], [1, 1]],
  4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
  6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
};

// Standard dice face rotations (CSS 3D)
const faceRotations: Record<number, { rx: number; ry: number }> = {
  1: { rx: 0, ry: 0 },
  2: { rx: 0, ry: 90 },
  3: { rx: 0, ry: -90 },
  4: { rx: 90, ry: 0 },
  5: { rx: -90, ry: 0 },
  6: { rx: 180, ry: 0 },
};

function DiceFace({ value, size = 56 }: { value: number; size?: number }) {
  const dots = dotPositions[value] || [];
  return (
    <div
      className="absolute inset-0 rounded-xl flex items-center justify-center"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(145deg, #2a1f1a 0%, #1a1614 50%, #0f0d0c 100%)',
        boxShadow: 'inset 0 1px 0 rgba(76, 141, 255, 0.2), 0 4px 16px rgba(0,0,0,0.5)',
        border: '1px solid var(--color-accent-primary-muted)',
      }}
    >
      <svg width={size - 8} height={size - 8} viewBox="-1.5 -1.5 3 3">
        {dots.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={0.32}
            fill="#4C8DFF"
            opacity={0.9}
          />
        ))}
      </svg>
    </div>
  );
}

// 3D Dice container with glass frame
function DiceCube({ result, isRolling }: { result: number | null; isRolling: boolean }) {
  const cubeRef = useRef<HTMLDivElement>(null);
  const rotRef = useRef({ rx: 0, ry: 0, rz: 0 });

  // Direct DOM update — bypasses React state to avoid 43 state-updates/sec during rolling
  const applyRotation = useCallback(() => {
    if (!cubeRef.current) return;
    const { rx, ry, rz } = rotRef.current;
    cubeRef.current.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`;
  }, []);

  useEffect(() => {
    if (isRolling) {
      // Throttled rAF via setTimeout — updates DOM directly, no React re-renders
      let timerId: ReturnType<typeof setTimeout>;
      const tick = () => {
        rotRef.current = {
          rx: Math.random() * 720,
          ry: Math.random() * 720,
          rz: Math.random() * 720,
        };
        applyRotation();
        timerId = setTimeout(tick, 70);
      };
      tick();
      return () => clearTimeout(timerId);
    }

    if (result !== null) {
      // Snap to the correct face — CSS transition handles the smooth animation
      const face = faceRotations[result];
      rotRef.current = { rx: face.rx, ry: face.ry, rz: 0 };
      applyRotation();
    }
  }, [result, isRolling, applyRotation]);

  const size = 56;
  const half = size / 2;

  return (
    <div
      className="relative"
      style={{
        width: size,
        height: size,
        perspective: 400,
      }}
    >
      <div
        ref={cubeRef}
        className="absolute inset-0"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(0deg) rotateY(0deg) rotateZ(0deg)`,
          transition: isRolling ? "none" : "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Front */}
        <div className="absolute inset-0" style={{ transform: `translateZ(${half}px)` }}>
          <DiceFace value={result || 5} size={size} />
        </div>
        {/* Back */}
        <div className="absolute inset-0" style={{ transform: `rotateY(180deg) translateZ(${half}px)` }}>
          <DiceFace value={6} size={size} />
        </div>
        {/* Left */}
        <div className="absolute inset-0" style={{ transform: `rotateY(-90deg) translateZ(${half}px)` }}>
          <DiceFace value={2} size={size} />
        </div>
        {/* Right */}
        <div className="absolute inset-0" style={{ transform: `rotateY(90deg) translateZ(${half}px)` }}>
          <DiceFace value={3} size={size} />
        </div>
        {/* Top */}
        <div className="absolute inset-0" style={{ transform: `rotateX(90deg) translateZ(${half}px)` }}>
          <DiceFace value={4} size={size} />
        </div>
        {/* Bottom */}
        <div className="absolute inset-0" style={{ transform: `rotateX(-90deg) translateZ(${half}px)` }}>
          <DiceFace value={1} size={size} />
        </div>
      </div>
    </div>
  );
}

export function Dice3D() {
  const { diceResult, isRolling } = useGameStore();
  const [showResult, setShowResult] = useState(false);
  const resultBadgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isRolling) {
      setShowResult(false);
    }
    if (diceResult !== null && !isRolling) {
      setTimeout(() => {
        setShowResult(true);
        if (resultBadgeRef.current) {
          createResultPopTimeline(resultBadgeRef.current);
        }
      }, 500);
    }
  }, [diceResult, isRolling]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Dice with glass tray — accent themed */}
      <div className="relative p-6 rounded-2xl glass-panel-tinted animate-dice-tray"
        style={{
          background: 'var(--color-glass-tint)',
          border: '1px solid var(--color-glass-jade-10)',
        }}
      >
        <div className="flex items-center justify-center" style={{ minHeight: 72 }}>
          <DiceCube result={diceResult} isRolling={isRolling} />
        </div>

        {/* Rolling shimmer effect */}
        {isRolling && (
          <div className="absolute inset-0 rounded-2xl animate-shimmer pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(76, 141, 255, 0.06) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
            }}
          />
        )}
      </div>

      {/* Result badge — accent glow */}
      <AnimatePresence>
        {showResult && diceResult && (
          <motion.div
            ref={resultBadgeRef}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 12, stiffness: 300 }}
            className="font-mono text-3xl font-bold px-5 py-2 rounded-xl border"
            style={{
              background: 'var(--color-accent-primary-muted)',
              borderColor: 'var(--color-glass-jade-30)',
              boxShadow: '0 0 30px var(--color-glass-jade-20)',
              color: 'var(--color-accent-primary)',
            }}
          >
            {diceResult}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rolling text */}
      <AnimatePresence>
        {isRolling && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm font-mono font-medium"
            style={{ color: 'var(--color-accent-primary)' }}
          >
            Rolling...
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
