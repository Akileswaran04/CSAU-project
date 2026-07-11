import { useMemo, useEffect, useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Cell, PathLine } from "./BoardCell";
import { TeamToken } from "./TeamToken";
import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "../../store/useGameStore";
import { boardCells } from "../../data/boardConfig";

/* ─── Board Content ─── */
export function BoardContent({ centerX, centerZ, resetKey }: { centerX: number; centerZ: number; resetKey?: number }) {
  const controlsRef = useRef<any>(null!);

  // Reset camera when resetKey changes — clean, no Canvas remount
  useEffect(() => {
    if (controlsRef.current && resetKey && resetKey > 0) {
      controlsRef.current.reset();
      controlsRef.current.update();
    }
  }, [resetKey]);

  const teams = useGameStore(useShallow((s) => s.teams));

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
      />
    </>
  );
}
