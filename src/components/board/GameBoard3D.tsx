import { Suspense, useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { generateBoard } from "../../data/boardConfig";
import { RotateCcw, Maximize2, Minimize2 } from "lucide-react";
import { BrandLogo } from "../shared/BrandLogo";
import { BoardContent } from "./BoardContent";
import { ErrorBoundary } from "../shared/ErrorBoundary";

// Board geometry helpers
const boardCenter = (() => {
  const cells = generateBoard();
  const xs = cells.map(c => c.position.x);
  const zs = cells.map(c => c.position.z);
  return {
    x: (Math.max(...xs) + Math.min(...xs)) / 2,
    z: (Math.max(...zs) + Math.min(...zs)) / 2,
  };
})();

interface GameBoard3DProps {
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

export function GameBoard3D({ onToggleFullscreen, isFullscreen }: GameBoard3DProps) {
  const [resetKey, setResetKey] = useState(0);

  const resetCamera = useCallback(() => {
    setResetKey((k) => k + 1);
  }, []);

  const { x: boardCenterX, z: boardCenterZ } = boardCenter;

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-2xl overflow-hidden">
      {/* Glass viewport frame */}
      <div className="absolute inset-0 rounded-2xl gradient-border z-10 pointer-events-none" />
      
      {/* 3D Canvas with error boundary — catches render crashes gracefully */}
      <ErrorBoundary>
        <Canvas
          shadows={{ type: THREE.PCFSoftShadowMap, enabled: true }}
          camera={{ position: [boardCenterX + 18, 14, boardCenterZ + 10], fov: isFullscreen ? 40 : 44 }}
          gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
          style={{ background: '#070809' }}
        >
          <Suspense
            fallback={
              <Html center>
                <div className="flex flex-col items-center gap-3">
                  <BrandLogo variant="mark" size={48} />
                  <p className="text-white/40 text-xs font-mono tracking-wider animate-pulse">
                    LOADING BOARD
                  </p>
                </div>
              </Html>
            }
          >
            <BoardContent 
              centerX={boardCenter.x} 
              centerZ={boardCenter.z} 
              resetKey={resetKey} 
            />
          </Suspense>
        </Canvas>
      </ErrorBoundary>

      {/* Fullscreen toggle button */}
      <button
        onClick={onToggleFullscreen}
        className="absolute top-4 right-4 z-20 glass-button p-2.5 text-white/50 hover:text-white"
        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Board"}
        aria-label={isFullscreen ? "Exit fullscreen view" : "Enter fullscreen view"}
      >
        {isFullscreen ? <Minimize2 size={18} aria-hidden="true" /> : <Maximize2 size={18} aria-hidden="true" />}
      </button>

      {/* Reset camera button */}
      <button
        onClick={resetCamera}
        className="absolute bottom-4 right-4 z-20 glass-button p-2.5 text-white/50 hover:text-white"
        title="Reset Camera"
        aria-label="Reset camera position"
      >
        <RotateCcw size={18} aria-hidden="true" />
      </button>

      {/* Glass frame overlay edges */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      />
    </div>
  );
}
