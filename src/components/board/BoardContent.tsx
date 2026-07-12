import { useMemo, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Cell, PathLine } from "./BoardCell";
import { TeamToken } from "./TeamToken";
import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "../../store/useGameStore";
import { boardCells } from "../../data/boardConfig";

/* ─── Constants ─── */
const CAMERA_FOLLOW_SPEED = 0.035; // lerp factor per frame (at 60fps) for smooth follow
const USER_INTERACTION_TIMEOUT = 3000; // ms before re-engaging follow after user orbit

/* ─── Camera Follow Component ─── */
function CameraFollow({
  controlsRef,
  activeTeam,
  gamePhase,
  followRef,
  lastInteractionRef,
  centerX,
  centerZ,
}: {
  controlsRef: React.RefObject<any>;
  activeTeam: { position: number } | undefined;
  gamePhase: string;
  followRef: React.MutableRefObject<boolean>;
  lastInteractionRef: React.MutableRefObject<number>;
  centerX: number;
  centerZ: number;
}) {
  const smoothTargetRef = useRef(new THREE.Vector3(centerX, 0, centerZ));
  const tmpVecRef = useRef(new THREE.Vector3()); // pooled to avoid GC

  useFrame((_state, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    // Normalize lerp speed to 60fps for frame-rate independence
    const adjustedSpeed = CAMERA_FOLLOW_SPEED * delta * 60;

    // Re-enable follow after timeout if user hasn't interacted
    if (!followRef.current) {
      const elapsed = performance.now() - lastInteractionRef.current;
      if (elapsed > USER_INTERACTION_TIMEOUT) {
        followRef.current = true;
        smoothTargetRef.current.copy(controls.target);
      }
    }

    if (!followRef.current || !activeTeam || gamePhase !== "active") {
      controls.update();
      return;
    }

    // Find the active team's current board cell position
    const cellIndex = Math.min(activeTeam.position, boardCells.length - 1);
    const cell = boardCells[cellIndex];
    if (!cell) {
      controls.update();
      return;
    }

    // Use pooled vector to avoid GC pressure
    tmpVecRef.current.set(cell.position.x, 0, cell.position.z);

    // Smoothly lerp toward the target
    smoothTargetRef.current.lerp(tmpVecRef.current, adjustedSpeed);

    // Set the OrbitControls target
    controls.target.copy(smoothTargetRef.current);
    controls.update();
  });

  return null;
}

/* ─── Board Content ─── */
export function BoardContent({ centerX, centerZ, resetKey }: { centerX: number; centerZ: number; resetKey?: number }) {
  const controlsRef = useRef<any>(null!);
  const followRef = useRef(true);
  const lastInteractionRef = useRef(0);
  const destinationCellRef = useRef<number | null>(null);

  // Reset camera when resetKey changes
  useEffect(() => {
    if (controlsRef.current && resetKey && resetKey > 0) {
      controlsRef.current.reset();
      controlsRef.current.update();
    }
  }, [resetKey]);

  // Get game state for camera following
  const teams = useGameStore(useShallow((s) => s.teams));
  const gamePhase = useGameStore((s) => s.gamePhase);
  const currentTeamIndex = useGameStore((s) => s.currentTeamIndex);

  // Count teams per cell for offset
  const cellTeamCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    teams.forEach((team) => {
      counts[team.position] = (counts[team.position] || 0) + 1;
    });
    return counts;
  }, [teams]);

  // Track per-cell team index
  const cellTeamIndex = useMemo(() => {
    const counts: Record<number, number> = {};
    return teams.map((team) => {
      const idx = counts[team.position] || 0;
      counts[team.position] = idx + 1;
      return { teamId: team.id, indexOnCell: idx };
    });
  }, [teams]);

  const activeTeam = teams[currentTeamIndex];

  // Ground disc covers the serpentine board's footprint (~13 units wide, ~6 deep)
  const groundRadius = 8;

  return (
    <>
      {/* Tighter bloom — only emissive surfaces glow, no uniform wash */}
      <EffectComposer multisampling={2}>
        <Bloom
          intensity={0.3}
          luminanceThreshold={0.65}
          luminanceSmoothing={0.5}
          mipmapBlur
        />
      </EffectComposer>

      {/* ─── Ancient Forge Lighting Rig ─── */}
      {/* Warm accent key light — the "forge fire" */}
      <directionalLight 
        position={[6, 15, 4]} 
        intensity={0.7} 
        color="#FFB07A"
        castShadow 
        shadow-bias={-0.0005}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={30}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      
      {/* Cool blue-grey rim light — edge separation */}
      <directionalLight position={[-6, 8, -4]} intensity={0.35} color="#6E8CA0" />
      
      {/* Low ambient — shadows read but don't crush to black */}
      <ambientLight intensity={0.15} color="#2A2520" />

      {/* Accent point light above the board center for warmth */}
      <pointLight position={[0, 8, centerZ]} intensity={0.3} color="#4C8DFF" distance={25} decay={2} />

      {/* ─── Forge Floor — soft shadow-receiving ground disc ─── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, centerZ]} receiveShadow>
        <circleGeometry args={[groundRadius, 32]} />
        <meshStandardMaterial
          color="#0B0D0E"
          metalness={0.2}
          roughness={0.8}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Subtle ambient rim glow on the floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.09, centerZ]}>
        <ringGeometry args={[groundRadius * 0.7, groundRadius, 32]} />
        <meshBasicMaterial
          color="#4C8DFF"
          transparent
          opacity={0.03}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ─── Serpentine Board ─── */}
      {/* Path line connecting cells */}
      <PathLine />

      {/* Board cells in serpentine snake layout */}
      {boardCells.map((cell) => (
        <Cell
          key={cell.index}
          position={cell.position}
          isRiddle={cell.type === "riddle"}
          isEnd={cell.type === "end"}
          difficulty={cell.difficulty}
          index={cell.index}
          isStart={cell.type === "start"}
          destinationCellRef={destinationCellRef}
        />
      ))}

      {/* Team tokens */}
      {teams.map((team) => {
        const info = cellTeamIndex.find((c) => c.teamId === team.id);
        return (
          <TeamToken
            key={team.id}
            team={team}
            targetCellIndex={Math.min(team.position, boardCells.length - 1)}
            teamCount={info?.indexOnCell ?? 0}
            totalTeamsOnCell={cellTeamCounts[team.position] ?? 1}
            destinationCellRef={destinationCellRef}
          />
        );
      })}

      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableDamping
        dampingFactor={0.08}
        minPolarAngle={THREE.MathUtils.degToRad(15)}
        maxPolarAngle={THREE.MathUtils.degToRad(70)}
        minDistance={5}
        maxDistance={65}
        target={[centerX, 0, centerZ]}
        onStart={() => {
          // User started interacting — disable auto-follow temporarily
          followRef.current = false;
          lastInteractionRef.current = performance.now();
        }}
        onEnd={() => {
          // User stopped interacting — note the time so we can re-enable later
          lastInteractionRef.current = performance.now();
        }}
      />

      {/* ─── Camera auto-follow: smoothly track the active team ─── */}
      <CameraFollow
        controlsRef={controlsRef}
        activeTeam={activeTeam}
        gamePhase={gamePhase}
        followRef={followRef}
        lastInteractionRef={lastInteractionRef}
        centerX={centerX}
        centerZ={centerZ}
      />
    </>
  );
}
