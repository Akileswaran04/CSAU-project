import { useEffect, useRef } from "react";
import { useSettingsStore, type ThemeMode } from "../../store/useSettingsStore";

/**
 * Animated gradient mesh background — single canvas combining radial gradient blobs
 * with liquid ellipse shimmer for a rich refractive effect.
 * The intensity is controlled by the Settings store (0 = off, 100 = full).
 * Respects prefers-reduced-motion by pausing animation.
 * Adapts base color to the active theme (dark/light).
 */
export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intensity = useSettingsStore((s) => s.backgroundIntensity);
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Check reduced motion preference
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const prefersReducedMotion = motionQuery.matches;

    let animId: number;
    let time = 0;
    let paused = prefersReducedMotion;

    // Track state via refs so the rAF loop doesn't need dependencies
    let currentIntensity = intensity;
    let currentTheme: ThemeMode = theme;
    const unsubSettings = useSettingsStore.subscribe((state) => {
      currentIntensity = state.backgroundIntensity;
      currentTheme = state.theme;
    });

    const handleMotionChange = (e: MediaQueryListEvent) => {
      paused = e.matches;
      if (!paused) draw();
    };

    motionQuery.addEventListener("change", handleMotionChange);

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      if (paused) return;

      time += 0.0015;
      const w = canvas.width;
      const h = canvas.height;

      // Base color adapts to theme — dark bg for dark mode, light bg for light mode
      ctx.fillStyle = currentTheme === "light" ? "#F5F3F0" : "#070809";
      ctx.fillRect(0, 0, w, h);

      // If intensity is 0, just paint the base color and stop
      if (currentIntensity === 0) {
        animId = requestAnimationFrame(draw);
        return;
      }

      const scale = currentIntensity / 100;

      // ── Radial gradient blobs (matching 3D atmosphere palette) ──
      const radialBlobs = [
        { x: 0.15, y: 0.4, dx: 0.06, dy: 0.08, r: 0.35, freqX: 0.35, freqY: 0.25, base: 0.06, r2: 47, g2: 217, b2: 168 },
        { x: 0.75, y: 0.2, dx: 0.05, dy: 0.06, r: 0.3, freqX: 0.3, freqY: 0.4, base: 0.04, r2: 255, g2: 217, b2: 102 },
        { x: 0.5, y: 0.75, dx: 0.06, dy: 0.05, r: 0.25, freqX: 0.2, freqY: 0.3, base: 0.035, r2: 153, g2: 179, b2: 255 },
        { x: 0.85, y: 0.6, dx: 0.04, dy: 0.06, r: 0.2, freqX: 0.45, freqY: 0.15, base: 0.03, r2: 47, g2: 217, b2: 168 },
      ];

      for (const b of radialBlobs) {
        const a = b.base * scale;
        if (a < 0.001) continue;
        const bx = w * (b.x + b.dx * Math.sin(time * b.freqX));
        const by = h * (b.y + b.dy * Math.cos(time * b.freqY));
        const br = w * b.r;
        const grad = ctx.createRadialGradient(bx, by, 0, bx, by, br);
        grad.addColorStop(0, `rgba(${b.r2}, ${b.g2}, ${b.b2}, ${a})`);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      // ── Liquid ellipse blobs (deeper, richer tones) ──
      const liquidBlobs = [
        // Jade — brand accent
        { cx: 0.2, cy: 0.3, rx: 0.3, ry: 0.2, r: 47, g: 217, b: 168, base: 0.06, phase: 0 },
        // Gold — warm glow
        { cx: 0.7, cy: 0.5, rx: 0.25, ry: 0.35, r: 255, g: 200, b: 80, base: 0.05, phase: 1.5 },
        // White-blue — cool contrast
        { cx: 0.4, cy: 0.7, rx: 0.35, ry: 0.15, r: 180, g: 200, b: 255, base: 0.04, phase: 3.0 },
        // Deep jade
        { cx: 0.85, cy: 0.25, rx: 0.2, ry: 0.25, r: 38, g: 184, b: 146, base: 0.045, phase: 4.5 },
        // Soft gold
        { cx: 0.1, cy: 0.8, rx: 0.2, ry: 0.3, r: 255, g: 180, b: 70, base: 0.035, phase: 6.0 },
      ];

      for (const b of liquidBlobs) {
        const a = b.base * scale;
        if (a < 0.001) continue;
        const cx = w * (b.cx + Math.sin(time * 0.25 + b.phase) * 0.05);
        const cy = h * (b.cy + Math.cos(time * 0.2 + b.phase) * 0.05);
        const rx = w * (b.rx + Math.sin(time * 0.15 + b.phase) * 0.015);
        const ry = h * (b.ry + Math.cos(time * 0.25 + b.phase) * 0.015);

        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, Math.sin(time * 0.1 + b.phase) * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${b.r}, ${b.g}, ${b.b}, ${a})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    if (!paused) {
      draw();
    } else {
      ctx.fillStyle = theme === "light" ? "#F5F3F0" : "#0B0D0E";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      cancelAnimationFrame(animId);
      unsubSettings();
      window.removeEventListener("resize", resize);
      motionQuery.removeEventListener("change", handleMotionChange);
    };
  }, [intensity, theme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
