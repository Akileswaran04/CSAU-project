import { useRef, memo } from "react";
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
  const velocities = [new Float32Array(MAX_PARTICLES), new Float32Array(MAX_PARTICLES), new Float32Array(MAX_PARTICLES)];
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

/* ─── Team Token with Cell-by-Cell Movement ─── */
export const TeamToken = memo(function TeamToken({ team, targetCellIndex, teamCount, totalTeamsOnCell }: TeamTokenProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const pulseRingRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const particleDataRef = useRef(createParticleBurst());
  const currentPosRef = useRef(new THREE.Vector3());
  const targetPosRef = useRef(new THREE.Vector3());
  const targetVecRef = useRef(new THREE.Vector3());
  const animProgressRef = useRef(1);
  const isMovingRef = useRef(false);
  const particleBurstRef = useRef(0);
  const particleFiredRef = useRef(false);

  // Calculate target position
  const targetCell = boardCells[Math.min(targetCellIndex, boardCells.length - 1)];

  // Offset multiple tokens on the same cell
  const angle = (Math.PI * 2 * teamCount) / Math.max(totalTeamsOnCell, 1);
  const radius = totalTeamsOnCell > 1 ? 0.35 : 0;
  const xOffset = Math.cos(angle) * radius;
  const zOffset = Math.sin(angle) * radius;

  // Animate step-by-step movement — pooled allocation, no GC pressure
  useFrame((state, delta) => {
    if (!groupRef.current || !targetCell) return;

    targetVecRef.current.set(
      targetCell.position.x + xOffset,
      0.3,
      targetCell.position.z + zOffset
    );

    // If position changed, reset animation
    if (!targetPosRef.current.equals(targetVecRef.current)) {
      currentPosRef.current.copy(groupRef.current.position);
      targetPosRef.current.copy(targetVecRef.current);
      animProgressRef.current = 0;
      isMovingRef.current = true;
    }

    const time = state.clock.elapsedTime;

    // Smooth interpolation with spring-like feel
    if (animProgressRef.current < 1) {
      animProgressRef.current += delta * 2.5;
      if (animProgressRef.current > 1) animProgressRef.current = 1;

      const t = animProgressRef.current;
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      groupRef.current.position.lerpVectors(currentPosRef.current, targetVecRef.current, ease);

      // Float bob — faster & higher during movement
      if (meshRef.current) {
        meshRef.current.position.y = 0.3 + Math.sin(time * 5 + teamCount) * 0.08;
      }
    } else {
      isMovingRef.current = false;
      // Idle float — slower, gentler, more organic
      if (meshRef.current) {
        meshRef.current.position.y = 0.3 + Math.sin(time * 2.5 + teamCount * 1.3) * 0.04 + Math.sin(time * 1.7 + teamCount * 0.7) * 0.02;
      }
    }

    // ─── Pulse ring animation ───
    if (pulseRingRef.current) {
      const mat = pulseRingRef.current.material as THREE.MeshBasicMaterial;
      if (isMovingRef.current) {
        // Expanding ring pulse
        const pulsePhase = animProgressRef.current;
        const scale = 1 + pulsePhase * 1.2;
        pulseRingRef.current.scale.setScalar(scale);
        mat.opacity = 0.35 * (1 - pulsePhase * 0.8);
      } else {
        // Gentle idle glow
        const glowPulse = 0.15 + Math.sin(time * 1.8 + teamCount) * 0.08;
        pulseRingRef.current.scale.setScalar(1);
        mat.opacity = glowPulse;
      }
    }

    // ─── Particle burst on arrival ───
    if (particlesRef.current) {
      const pd = particleDataRef.current;
      const geo = particlesRef.current.geometry;
      const pos = geo.attributes.position.array as Float32Array;

      if (animProgressRef.current >= 1 && !isMovingRef.current) {
        // Fire particles ONCE on arrival
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
        // Advance burst phase
        particleBurstRef.current = Math.min(particleBurstRef.current + delta * 3, 1);
      } else {
        // Reset when moving
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
        (particlesRef.current.material as THREE.PointsMaterial).opacity = Math.max(0, particleBurstRef.current * 0.6 - 0.2);
      } else {
        (particlesRef.current.material as THREE.PointsMaterial).opacity = 0;
      }
    }
  });

  if (!targetCell) return null;

  return (
    <group
      ref={groupRef}
      position={[targetCell.position.x + xOffset, 0, targetCell.position.z + zOffset]}

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
        <meshBasicMaterial
          color={team.color}
          transparent
          opacity={0.15}
        />
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

      {/* Token float anchor (invisible) — keep meshRef for useFrame position/bob */}
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
