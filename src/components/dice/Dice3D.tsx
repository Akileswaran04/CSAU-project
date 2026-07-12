import { useState, useEffect, useRef } from "react";
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
        background:
          "linear-gradient(145deg, #2a1f1a 0%, #1a1614 50%, #0f0d0c 100%)",
        boxShadow:
          "inset 0 1px 0 rgba(76, 141, 255, 0.2), 0 4px 16px rgba(0,0,0,0.5)",
        border: "1px solid var(--color-accent-primary-muted)",
      }}
    >
      <svg width={size - 8} height={size - 8} viewBox="-1.5 -1.5 3 3">
        {dots.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={0.32} fill="#4C8DFF" opacity={0.9} />
        ))}
      </svg>
    </div>
  );
}

// ─── Smooth, controlled dice roll using requestAnimationFrame ───
function DiceCube({
  result,
  isRolling,
}: {
  result: number | null;
  isRolling: boolean;
}) {
  const cubeRef = useRef<HTMLDivElement>(null);
  const spinRef = useRef<{
    startTime: number;
    totalAngle: { x: number; y: number; z: number };
  } | null>(null);
  const settleRef = useRef(false);

  // ─── Spin effect: runs the whole time isRolling is true ───
  useEffect(() => {
    if (!isRolling) return;

    settleRef.current = false;

    spinRef.current = {
      startTime: performance.now(),
      totalAngle: { x: 0, y: 0, z: 0 },
    };

    const axis = {
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
      z: (Math.random() - 0.5) * 0.5,
    };
    const initialSpeed = 6 + Math.random() * 3;
    const decay = 0.93; // gentle decay per frame

    let animId: number;

    const tick = (now: number) => {
      if (settleRef.current || !cubeRef.current || !spinRef.current) return;

      const elapsed = now - spinRef.current.startTime;

      // Speed decelerates smoothly over time
      const speed = initialSpeed * Math.pow(decay, elapsed / 16);

      // Stop ticking once imperceptible — saves rAF cycles
      if (speed < 0.02) return;

      // Accumulate angle
      spinRef.current.totalAngle.x += axis.x * speed;
      spinRef.current.totalAngle.y += axis.y * speed;
      spinRef.current.totalAngle.z += axis.z * speed * 0.5;

      cubeRef.current.style.transition = "none";
      cubeRef.current.style.transform = `rotateX(${spinRef.current.totalAngle.x}deg) rotateY(${spinRef.current.totalAngle.y}deg) rotateZ(${spinRef.current.totalAngle.z}deg)`;

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isRolling]);

  // ─── Settle effect: fires once when rolling ends with a result ───
  useEffect(() => {
    if (result === null || isRolling || settleRef.current) return;

    settleRef.current = true;

    const face = faceRotations[result];
    const overshootRx = face.rx + (Math.random() - 0.5) * 720;
    const overshootRy = face.ry + (Math.random() - 0.5) * 720;

    if (cubeRef.current) {
      // Fling to overshoot instantly
      cubeRef.current.style.transition = "none";
      cubeRef.current.style.transform = `rotateX(${overshootRx}deg) rotateY(${overshootRy}deg) rotateZ(0deg)`;

      // Force layout to commit the overshoot
      void cubeRef.current.offsetHeight;

      // Bouncy settle into correct face
      cubeRef.current.style.transition =
        "transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)";
      cubeRef.current.style.transform = `rotateX(${face.rx}deg) rotateY(${face.ry}deg) rotateZ(0deg)`;
    }
  }, [result, isRolling]);

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
          transform: "rotateX(0deg) rotateY(0deg) rotateZ(0deg)",
          transition:
            "transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Front (face 1) */}
        <div
          className="absolute inset-0"
          style={{ transform: `translateZ(${half}px)` }}
        >
          <DiceFace value={result || 5} size={size} />
        </div>
        {/* Back (face 6) */}
        <div
          className="absolute inset-0"
          style={{ transform: `rotateY(180deg) translateZ(${half}px)` }}
        >
          <DiceFace value={6} size={size} />
        </div>
        {/* Left (face 2) */}
        <div
          className="absolute inset-0"
          style={{ transform: `rotateY(-90deg) translateZ(${half}px)` }}
        >
          <DiceFace value={2} size={size} />
        </div>
        {/* Right (face 3) */}
        <div
          className="absolute inset-0"
          style={{ transform: `rotateY(90deg) translateZ(${half}px)` }}
        >
          <DiceFace value={3} size={size} />
        </div>
        {/* Top (face 4) */}
        <div
          className="absolute inset-0"
          style={{ transform: `rotateX(90deg) translateZ(${half}px)` }}
        >
          <DiceFace value={4} size={size} />
        </div>
        {/* Bottom (face 1) */}
        <div
          className="absolute inset-0"
          style={{ transform: `rotateX(-90deg) translateZ(${half}px)` }}
        >
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
      const t = setTimeout(() => {
        setShowResult(true);
        if (resultBadgeRef.current) {
          createResultPopTimeline(resultBadgeRef.current);
        }
      }, 800);
      return () => clearTimeout(t);
    }
  }, [diceResult, isRolling]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative p-6 rounded-2xl glass-panel-tinted animate-dice-tray"
        style={{
          background: "var(--color-glass-tint)",
          border: "1px solid var(--color-glass-jade-10)",
        }}
      >
        <div className="flex items-center justify-center" style={{ minHeight: 72 }}>
          <DiceCube result={diceResult} isRolling={isRolling} />
        </div>
        {isRolling && (
          <div
            className="absolute inset-0 rounded-2xl animate-shimmer pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(76, 141, 255, 0.06) 50%, transparent 100%)",
              backgroundSize: "200% 100%",
            }}
          />
        )}
      </div>
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
              background: "var(--color-accent-primary-muted)",
              borderColor: "var(--color-glass-jade-30)",
              boxShadow: "0 0 30px var(--color-glass-jade-20)",
              color: "var(--color-accent-primary)",
            }}
          >
            {diceResult}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isRolling && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm font-mono font-medium"
            style={{ color: "var(--color-accent-primary)" }}
          >
            Rolling...
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
