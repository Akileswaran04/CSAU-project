import { useId, useRef, useEffect } from "react";

interface LiquidDistortionProps {
  className?: string;
  intensity?: number;
  speed?: number;
  children?: React.ReactNode;
}

/**
 * SVG Liquid Distortion effect using feTurbulence and feDisplacementMap.
 * Creates a fluid, organic distortion animation that can warp any child content.
 * Respects prefers-reduced-motion.
 */
export function LiquidDistortion({
  className = "",
  intensity = 15,
  speed = 1,
  children,
}: LiquidDistortionProps) {
  const id = useId();
  const filterId = `liquid-${id}`;
  const turbulenceRef = useRef<SVGFETurbulenceElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) return;

    const turb = turbulenceRef.current;
    if (!turb) return;

    let running = true;

    const animate = () => {
      if (!running) return;
      timeRef.current += 0.005 * speed;

      // Animate baseFrequency for fluid-like distortion
      const baseFreqX = 0.008 + Math.sin(timeRef.current * 0.7) * 0.004;
      const baseFreqY = 0.015 + Math.cos(timeRef.current * 0.5) * 0.006;
      turb.setAttribute("baseFrequency", `${baseFreqX} ${baseFreqY}`);

      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [speed]);

  return (
    <div className={`relative ${className}`}>
      {/* Hidden SVG filter definition */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              ref={turbulenceRef}
              type="fractalNoise"
              baseFrequency="0.01 0.02"
              numOctaves="3"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={intensity}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Apply filter to content */}
      <div
        style={{ filter: `url(#${filterId})` }}
        className="w-full h-full"
      >
        {children}
      </div>
    </div>
  );
}


