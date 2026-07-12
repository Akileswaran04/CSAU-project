import { useRef, memo, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { type Team } from "../../store/useGameStore";
import { TeamIconDisplay } from "../shared/TeamIconDisplay";
import { boardCells } from "../../data/boardConfig";

/* ─── Particle burst on arrival ─── */
const MAX_PARTICLES = 20;
function createParticleBurst(): {
  positions: Float32Array;
  velocities: Float32Array[];
  life: Float32Array;
} {
  const positions = new Float32Array(MAX_PARTICLES * 3);
  const velocities = [
    new Float32Array(MAX_PARTICLES),
    new Float32Array(MAX_PARTICLES),
    new Float32Array(MAX_PARTICLES),
  ];
  const life = new Float32Array(MAX_PARTICLES);
  for (let i = 0; i < MAX_PARTICLES; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 0.4;
    const speed = 0.5 + Math.random() * 1.2;
    positions[i * 3] = (Math.random() - 0.5) * 0.2;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
    velocities[0][i] = Math.sin(theta) * Math.cos(phi) * speed;
    velocities[1][i] = Math.abs(Math.sin(phi) * speed) * 0.8 + 0.4;
    velocities[2][i] = Math.cos(theta) * Math.cos(phi) * speed;
    life[i] = 0;
  }
  return { positions, velocities, life };
}

/* ─── Team Token Props ─── */
export interface TeamTokenProps {
  team: Team;
  targetCellIndex: number;
  teamCount: number;
  totalTeamsOnCell: number;
}

/* ─── Helper: ease-out cubic ─── */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/* ─── Team Token with Step-by-Step Cell Movement ─── */
export const TeamToken = memo(function TeamToken({
  team,
  targetCellIndex,
  teamCount,
  totalTeamsOnCell,
}: TeamTokenProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const pulseRingRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const particleDataRef = useRef(createParticleBurst());

  // ─── Cell-by-cell path state ───
  const lastTargetRef = useRef(targetCellIndex);
  const pathRef = useRef<number[]>([]); // array of cell indices along the path
  const pathIdxRef = useRef(0); // which leg of the path we're on
  const legProgressRef = useRef(1); // 0→1 for current leg
  const fromPosRef = useRef(new THREE.Vector3());
  const toPosRef = useRef(new THREE.Vector3());
  const isMovingRef = useRef(false);
  const particleBurstRef = useRef(0);
  const particleFiredRef = useRef(false);

  // Offset multiple tokens on the same cell
  const { xOffset, zOffset } = useMemo(() => {
    const angle = (Math.PI * 2 * teamCount) / Math.max(totalTeamsOnCell, 1);
    const radius = totalTeamsOnCell > 1 ? 0.35 : 0;
    return {
      xOffset: Math.cos(angle) * radius,
      zOffset: Math.sin(angle) * radius,
    };
  }, [teamCount, totalTeamsOnCell]);

  // Detect target change → rebuild path
  if (lastTargetRef.current !== targetCellIndex) {
    const from = Math.min(lastTargetRef.current, boardCells.length - 1);
    const to = Math.min(targetCellIndex, boardCells.length - 1);
    lastTargetRef.current = targetCellIndex;

    // Build path: walk forward/backward through each intermediate cell
    const step = to >= from ? 1 : -1;
    const path: number[] = [];
    for (let i = from; i !== to + step; i += step) {
      path.push(i);
    }
    pathRef.current = path;
    pathIdxRef.current = 0;
    legProgressRef.current = 0;
    isMovingRef.current = true;

    // Set initial fromPos to current position or first path cell
    const firstCell = boardCells[path[0]];
    if (groupRef.current && path.length > 0) {
      fromPosRef.current.copy(groupRef.current.position);
    } else if (firstCell) {
      fromPosRef.current.set(firstCell.position.x + xOffset, 0, firstCell.position.z + zOffset);
    }

    // Set toPos to the first destination cell (second cell in path)
    if (path.length > 1) {
      const nextCell = boardCells[path[1]];
      toPosRef.current.set(nextCell.position.x + xOffset, 0.3, nextCell.position.z + zOffset);
    } else {
      toPosRef.current.copy(fromPosRef.current);
    }
  }

  // ─── Animate cell-by-cell ───
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    const path = pathRef.current;

    if (isMovingRef.current && legProgressRef.current < 1) {
      // Advance through legs
      legProgressRef.current += delta * 3.0;

      if (legProgressRef.current >= 1) {
        // Snap to this cell's exact position
        groupRef.current.position.copy(toPosRef.current);
        pathIdxRef.current += 1;

        if (pathIdxRef.current >= path.length - 1) {
          // Reached final cell — done moving
          legProgressRef.current = 1;
          isMovingRef.current = false;
          // Fire arrival particles
          particleFiredRef.current = false;
          particleBurstRef.current = 0;
        } else {
          // Move to next leg
          legProgressRef.current = 0;
          fromPosRef.current.copy(toPosRef.current);
          const nextCell = boardCells[path[pathIdxRef.current + 1]];
          toPosRef.current.set(
            nextCell.position.x + xOffset,
            0.3,
            nextCell.position.z + zOffset
          );
        }
      } else {
        const t = easeOutCubic(legProgressRef.current);

        // Horizontal position
        const x = fromPosRef.current.x + (toPosRef.current.x - fromPosRef.current.x) * t;
        const z = fromPosRef.current.z + (toPosRef.current.z - fromPosRef.current.z) * t;

        // Hop arc: parabolic bounce up and back down
        const arcHeight = Math.sin(legProgressRef.current * Math.PI) * 0.25;
        const y = 0.3 + arcHeight;

        groupRef.current.position.set(x, y, z);

        // Float bob on top of hop
        if (meshRef.current) {
          meshRef.current.position.y = 0.3 + Math.sin(time * 5 + pathIdxRef.current) * 0.04;
        }
      }
    } else {
      // ─── Idle float ───
      if (meshRef.current) {
        meshRef.current.position.y =
          0.3 +
          Math.sin(time * 2.5 + teamCount * 1.3) * 0.04 +
          Math.sin(time * 1.7 + teamCount * 0.7) * 0.02;
      }
    }

    // ─── Pulse ring animation ───
    if (pulseRingRef.current) {
      const mat = pulseRingRef.current.material as THREE.MeshBasicMaterial;
      if (isMovingRef.current) {
        // Ring expands with each hop
        const scale = 1 + legProgressRef.current * 1.2;
        pulseRingRef.current.scale.setScalar(scale);
        mat.opacity = 0.35 * (1 - legProgressRef.current * 0.8);
      } else {
        // Gentle idle glow
        const glowPulse = 0.15 + Math.sin(time * 1.8 + teamCount) * 0.08;
        pulseRingRef.current.scale.setScalar(1);
        mat.opacity = glowPulse;
      }
    }

    // ─── Particle burst on final arrival ───
    if (particlesRef.current) {
      const pd = particleDataRef.current;
      const geo = particlesRef.current.geometry;
      const pos = geo.attributes.position.array as Float32Array;

      if (!isMovingRef.current) {
        if (!particleFiredRef.current) {
          particleFiredRef.current = true;
          particleBurstRef.current = 0.5;
          for (let i = 0; i < MAX_PARTICLES; i++) {
            pd.life[i] = 1;
            pos[i * 3] = (Math.random() - 0.5) * 0.1;
            pos[i * 3 + 1] = 0;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
          }
        }
        particleBurstRef.current = Math.min(particleBurstRef.current + delta * 3, 1);
      } else {
        particleBurstRef.current = 0;
        particleFiredRef.current = false;
      }

      if (particleBurstRef.current > 0.1) {
        for (let i = 0; i < MAX_PARTICLES; i++) {
          if (pd.life[i] > 0) {
            pd.life[i] -= delta * 1.5;
            pos[i * 3] += pd.velocities[0][i] * delta;
            pos[i * 3 + 1] += pd.velocities[1][i] * delta;
            pos[i * 3 + 2] += pd.velocities[2][i] * delta;
          }
        }
        geo.attributes.position.needsUpdate = true;
        (particlesRef.current.material as THREE.PointsMaterial).opacity = Math.max(
          0,
          particleBurstRef.current * 0.6 - 0.2
        );
      } else {
        (particlesRef.current.material as THREE.PointsMaterial).opacity = 0;
      }
    }
  });

  // Compute the final position for initial placement
  const finalCell = boardCells[Math.min(targetCellIndex, boardCells.length - 1)];
  if (!finalCell) return null;

  return (
    <group
      ref={groupRef}
      position={[
        finalCell.position.x + xOffset,
        0,
        finalCell.position.z + zOffset,
      ]}
    >
      {/* Pulse ring */}
      <mesh
        ref={pulseRingRef}
        position={[0, 0.05, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.2, 0.45, 24]} />
        <meshBasicMaterial
          color={team.color}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Glow under token */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.35, 16]} />
        <meshBasicMaterial color={team.color} transparent opacity={0.15} />
      </mesh>

      {/* Arrival particle burst */}
      <points ref={particlesRef} position={[0, 0.15, 0]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particleDataRef.current.positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color={team.color}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Token float anchor (invisible) */}
      <mesh ref={meshRef} position={[0, 0.3, 0]} visible={false}>
        <planeGeometry args={[0.01, 0.01]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Token icon badge — always faces camera via Html billboard */}
      <Html center position={[0, 0.3, 0]}>
        <div
          className="flex items-center justify-center"
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            backgroundColor: team.color,
            color: "#fff",
            border: `2px solid ${team.color}80`,
          }}
        >
          <TeamIconDisplay icon={team.icon} size={16} />
        </div>
      </Html>

      {/* Team name label */}
      <Html center position={[0, 0.75, 0]}>
        <div
          className="team-token-label text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap backdrop-blur-sm"
          style={{
            backgroundColor: `${team.color}25`,
            border: `1px solid ${team.color}50`,
            color: "var(--color-fg-default)",
          }}
        >
          {team.name}
        </div>
      </Html>
    </group>
  );
});
