import { useRef, useMemo, memo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, RoundedBox, Line } from "@react-three/drei";
import * as THREE from "three";
import { boardCells } from "../../data/boardConfig";
import { useSettingsStore } from "../../store/useSettingsStore";

/* ─── Types ─── */
export interface CellProps {
  position: { x: number; z: number };
  isRiddle: boolean;
  isEnd: boolean;
  difficulty?: "easy" | "medium" | "hard";
  index: number;
  isStart: boolean;
  /** Shared ref: when non-null, this cell index pulses brighter as a hop destination */
  destinationCellRef?: React.MutableRefObject<number | null>;
}

/* ─── Difficulty Helpers ─── */
export const difficultyColors: Record<string, string> = {
  easy: "#C6F135",
  medium: "#FFB830",
  hard: "#E11D3C",
};



/* ─── Path Line with underglow ─── */
export function PathLine() {
  const points = useMemo(() => {
    return boardCells.map((cell) => [cell.position.x, 0.05, cell.position.z] as [number, number, number]);
  }, []);

  return (
    <>
      {/* Soft under-glow path — reads as an intentional trail */}
      <Line
        points={points}
        color="#4C8DFF"
        opacity={0.06}
        transparent
        lineWidth={6}
      />
      {/* Core path line — the visible trail */}
      <Line
        points={points}
        color="#4C8DFF"
        opacity={0.2}
        transparent
        lineWidth={2}
      />
    </>
  );
}

/* ─── Difficulty Badge SVG ─── */
function DifficultyBadge({ difficulty, color }: { difficulty: string; color: string }) {
  const label = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  return (
    <div
      className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold font-display uppercase tracking-wider"
      style={{
        color,
        backgroundColor: color + "18",
        border: `1px solid ${color}30`,
      }}
    >
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
        <circle cx="4" cy="4" r="3" fill={color} opacity="0.8" />
      </svg>
      {label}
    </div>
  );
}

/* ─── Cell Animator (only mounted for riddle/end cells) ─── */
function CellAnimator({ meshRef, glowRef, index }: {
  meshRef: React.RefObject<THREE.Mesh | null>;
  glowRef: React.RefObject<THREE.Mesh | null>;
  index: number;
}) {
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime;
      const glow = 0.3 + Math.sin(time * 2 + index * 0.5) * 0.2;
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      if (mat) mat.emissiveIntensity = glow;
    }
    if (glowRef.current) {
      const time = state.clock.elapsedTime;
      glowRef.current.position.y = 0.05 + Math.sin(time * 1.5 + index) * 0.03;
    }
  });
  return null;
}

/* ─── Highlight Animator: pulses the cell brighter when it's the hop destination ─── */
function HighlightAnimator({
  meshRef,
  glowRef,
  groupRef,
  index,
  destinationCellRef,
  baseEmissiveIntensity,
}: {
  meshRef: React.RefObject<THREE.Mesh | null>;
  glowRef: React.RefObject<THREE.Mesh | null>;
  groupRef: React.RefObject<THREE.Group | null>;
  index: number;
  destinationCellRef: React.MutableRefObject<number | null>;
  baseEmissiveIntensity: number;
}) {
  useFrame((state) => {
    const isHighlighted = destinationCellRef.current === index;
    if (!meshRef.current) return;

    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    const time = state.clock.elapsedTime;

    if (isHighlighted) {
      // Quick bright pulse: emissive bounces between 0.8 and 1.4
      const pulse = 0.8 + Math.sin(time * 5 + index * 2) * 0.3;
      mat.emissiveIntensity = pulse;

      // Gentle scale bounce
      if (groupRef.current) {
        const scalePulse = 1 + Math.sin(time * 5 + index * 2) * 0.03;
        groupRef.current.scale.setScalar(scalePulse);
      }

      // Brighten the glow ring
      if (glowRef.current) {
        const glowMat = glowRef.current.material as THREE.MeshBasicMaterial;
        glowMat.opacity = 0.25 + Math.sin(time * 4 + index * 2) * 0.15;
        const ringScale = 1 + Math.sin(time * 4 + index * 2) * 0.08;
        glowRef.current.scale.setScalar(ringScale);
      }
    } else {
      // Reset emissive to base value (critical: prevents permanently bright cells)
      mat.emissiveIntensity = baseEmissiveIntensity;

      // Reset glow ring
      if (glowRef.current) {
        const glowMat = glowRef.current.material as THREE.MeshBasicMaterial;
        glowMat.opacity = 0.15;
        glowRef.current.scale.setScalar(1);
      }
    }
  });

  return null;
}

/* ─── Cell ─── */
export const Cell = memo(function Cell({ position, isRiddle, isEnd, difficulty, index, isStart, destinationCellRef }: CellProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  const theme = useSettingsStore((s) => s.theme);
  const isDark = theme === "dark";

  const baseColor = isStart
    ? "#4C8DFF"
    : isEnd
      ? "#FFB830"
      : isRiddle && difficulty
        ? difficultyColors[difficulty]
        : "#1a1e20";

  const cellHeight = isStart || isEnd ? 0.45 : isRiddle ? 0.35 : 0.3;

  // Store the base emissive intensity so HighlightAnimator can reset properly
  const baseEmissiveIntensity = isRiddle || isEnd ? 0.4 : isStart ? 0.15 : isDark ? 0.04 : 0;

  // Hover: directly set material/scale via pointer events — no per-frame useFrame
  const handlePointerEnter = () => {
    if (groupRef.current) groupRef.current.scale.setScalar(1.12);
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      if (mat) mat.emissiveIntensity = 0.8;
    }
  };
  const handlePointerLeave = () => {
    if (groupRef.current) groupRef.current.scale.setScalar(1);
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      if (mat) mat.emissiveIntensity = baseEmissiveIntensity;
    }
  };

  return (
    <group
      ref={groupRef}
      position={[position.x, 0, position.z]}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >

      {/* Cell body */}
      <RoundedBox
        ref={meshRef}
        args={[1.7, cellHeight, 1.7]}
        radius={isStart || isEnd ? 0.16 : 0.12}
        smoothness={4}
      >
        <meshStandardMaterial
          color={baseColor}
          metalness={isRiddle || isEnd ? 0.6 : isStart ? 0.4 : 0.2}
          roughness={isRiddle || isEnd ? 0.3 : isStart ? 0.4 : 0.7}
          emissive={isRiddle || isEnd ? baseColor : isStart ? "#4C8DFF" : isDark ? "#4C8DFF" : "#000000"}
          emissiveIntensity={baseEmissiveIntensity}
        />
      </RoundedBox>



      {/* Glow ring for riddle/end/start cells — more distinct between types */}
      {(isRiddle || isEnd || isStart) && (
        <>
          <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[0.8, 1.05, 32]} />
            <meshBasicMaterial
              color={isStart ? "#4C8DFF" : isEnd ? "#FFB830" : baseColor}
              transparent
              opacity={isStart ? 0.1 : 0.15}
              side={THREE.DoubleSide}
            />
          </mesh>

        </>
      )}

      {/* Cell number label */}
      <Html center position={[0, cellHeight / 2 + 0.15, 0]}>
        <div
          className={`font-mono text-xs font-bold px-1 ${
            isRiddle || isEnd ? "text-white" : "text-white/25"
          }`}
        >
          {index + 1}
        </div>
      </Html>

      {/* Difficulty badge (SVG, no emoji) */}
      {isRiddle && difficulty && (
        <Html center position={[0, 0.75, 0]}>
          <DifficultyBadge difficulty={difficulty} color={difficultyColors[difficulty]} />
        </Html>
      )}

      {/* End marker */}
      {isEnd && (
        <Html center position={[0, 0.9, 0]}>
          <div
            className="text-[10px] font-bold font-display px-3 py-1 rounded-full border animate-pulse-glow uppercase tracking-wider"
            style={{
              color: "var(--color-accent-gold)",
              backgroundColor: "var(--color-accent-gold-muted)",
              borderColor: "rgba(255, 184, 48, 0.4)",
            }}
          >
            Finish
          </div>
        </Html>
      )}

      {/* Start marker */}
      {isStart && (
        <Html center position={[0, 0.7, 0]}>
          <div
            className="text-[10px] font-bold font-display px-2 py-0.5 rounded-full border uppercase tracking-wider"
            style={{
              color: "var(--color-accent-primary)",
              backgroundColor: "var(--color-accent-primary-muted)",
              borderColor: "var(--color-glass-jade-30)",
            }}
          >
            Start
          </div>
        </Html>
      )}

      {/* Cell animator for riddle/end cells */}
      {(isRiddle || isEnd) && (
        <CellAnimator meshRef={meshRef} glowRef={glowRef} index={index} />
      )}

      {/* Highlight animator: pulses when this cell is the hop destination */}
      {destinationCellRef && (
        <HighlightAnimator
          meshRef={meshRef}
          glowRef={glowRef}
          groupRef={groupRef}
          index={index}
          destinationCellRef={destinationCellRef}
          baseEmissiveIntensity={baseEmissiveIntensity}
        />
      )}
    </group>
  );
});
