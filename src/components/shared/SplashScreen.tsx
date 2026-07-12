import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { BrandLogo } from "./BrandLogo";
import { sounds } from "../../lib/sound";

/* ─── Constants ─── */
const ACCENT = "#4C8DFF";
const BAR_W = 200;
const BAR_H = 3;

/* ─── Floating background particles ─── */
function ParticleField() {
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1.5 + Math.random() * 2.5,
        delay: Math.random() * 3,
        duration: 5 + Math.random() * 6,
        driftX: (Math.random() - 0.5) * 40,
        driftY: (Math.random() - 0.5) * 30,
      })),
    []
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: "rgba(76, 141, 255, 0.25)",
          }}
          animate={{
            x: [0, p.driftX, 0],
            y: [0, p.driftY, 0],
            opacity: [0, 0.6, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ─── Subtle progress percentage ───
 *   Counts 0→100 in sync with the wave bar using the same timing (350ms delay,
 *   easeInOut). Uses rAF for smooth, frame-accurate updates.
 */
function ProgressNumber({ duration: dur }: { duration: number }) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const delay = 350; // matches WaveBar delay (0.35s)
    const animDur = dur - 300; // matches WaveBar duration: (dur/1000 - 0.3) * 1000
    let raf: number;

    const tick = () => {
      const elapsed = performance.now() - start;
      const t = Math.max(0, Math.min(1, (elapsed - delay) / animDur));
      // easeInOut
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      setPct(Math.round(eased * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dur]);

  return (
    <motion.p
      className="text-center font-mono text-[11px] tabular-nums tracking-[0.15em]"
      style={{ color: "var(--color-fg-faint)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.55 }}
      transition={{ delay: 0.5, duration: 0.4 }}
    >
      {String(pct).padStart(2, "0")}%
    </motion.p>
  );
}

/* ─── Wave progression bar ───
 *   A slim bar with a gradient fill that shimmers with a wave animation.
 *   The leading edge has a soft glow, and the filled portion has a
 *   subtle animated diagonal striation that moves continuously.
 */
function WaveBar({ duration: dur }: { duration: number }) {
  return (
    <div
      className="relative rounded-full overflow-hidden"
      style={{
        width: BAR_W,
        height: BAR_H,
        background: "rgba(255, 255, 255, 0.05)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* Filled portion */}
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          width: "100%",
          background: `linear-gradient(90deg, ${ACCENT}60, ${ACCENT}, ${ACCENT}CC)`,
          boxShadow: `0 0 8px ${ACCENT}30, 0 0 20px ${ACCENT}15`,
          transformOrigin: "left center",
        }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{
          duration: dur / 1000 - 0.3,
          delay: 0.35,
          ease: "easeInOut",
        }}
      >
        {/* Wave shimmer overlay */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `repeating-linear-gradient(
              90deg,
              transparent 0%,
              rgba(255,255,255,0.08) 25%,
              transparent 50%,
              rgba(255,255,255,0.08) 75%,
              transparent 100%
            )`,
            backgroundSize: "200% 100%",
          }}
          animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </motion.div>

      {/* Leading-edge glow dot */}
      <motion.div
        className="absolute top-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: 6,
          height: 6,
          background: ACCENT,
          boxShadow: `0 0 6px ${ACCENT}, 0 0 12px ${ACCENT}60`,
          left: -3,
        }}
        initial={{ left: -3 }}
        animate={{ left: BAR_W - 3 }}
        transition={{
          duration: dur / 1000 - 0.3,
          delay: 0.35,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

/* ─── Pulsing dot row ─── */
function DotRow() {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="rounded-full"
          style={{
            width: 3,
            height: 3,
            background: ACCENT,
          }}
          animate={{ opacity: [0.2, 0.8, 0.2] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.25,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ─── Cue lines (flanking the logo) ─── */
function CueLines() {
  return (
    <div className="flex items-center gap-3">
      <motion.div
        className="h-px rounded-full"
        style={{
          width: 40,
          background: "linear-gradient(90deg, transparent, rgba(76,141,255,0.2))",
        }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      />
      <DotRow />
      <motion.div
        className="h-px rounded-full"
        style={{
          width: 40,
          background: "linear-gradient(90deg, rgba(76,141,255,0.2), transparent)",
        }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      />
    </div>
  );
}

/* ─── SplashScreen ─── */

interface SplashScreenProps {
  /** Duration in ms before auto-dismiss. Default 3200. */
  duration?: number;
  /** Called when the splash screen finishes. */
  onFinish: () => void;
}

/**
 * Riddle Rush branded splash screen with a linear progression wave bar.
 */
export function SplashScreen({
  duration = 3200,
  onFinish,
}: SplashScreenProps) {
  const [phase, setPhase] = useState<"enter" | "idle" | "exit">("enter");
  const exitHandled = useRef(false);

  // Auto-dismiss after duration
  useEffect(() => {
    const t = setTimeout(() => setPhase("exit"), duration);
    return () => clearTimeout(t);
  }, [duration]);

  // Handle exit animation complete
  useEffect(() => {
    if (phase === "exit" && !exitHandled.current) {
      exitHandled.current = true;
      const t = setTimeout(() => onFinish(), 600);
      return () => clearTimeout(t);
    }
  }, [phase, onFinish]);

  // Immediate dismiss on any interaction (also satisfies autoplay policy)
  const handleInteract = useCallback(() => {
    if (phase !== "exit") {
      sounds.chime.play();
      setPhase("exit");
    }
  }, [phase]);

  useEffect(() => {
    window.addEventListener("click", handleInteract);
    window.addEventListener("keydown", handleInteract);
    return () => {
      window.removeEventListener("click", handleInteract);
      window.removeEventListener("keydown", handleInteract);
    };
  }, [handleInteract]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden select-none"
      style={{ background: "var(--color-bg-base)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: phase === "exit" ? 0 : 1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      {/* ─── Background: gradient blobs ─── */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute rounded-full"
          style={{
            width: "min(60vw, 500px)",
            height: "min(60vw, 500px)",
            top: "8%",
            left: "3%",
            background: "radial-gradient(circle, rgba(47,217,168,0.10) 0%, transparent 70%)",
            filter: "blur(100px)",
          }}
          animate={{ x: [0, 25, -15, 0], y: [0, -15, 25, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            width: "min(50vw, 380px)",
            height: "min(50vw, 380px)",
            bottom: "12%",
            right: "3%",
            background: "radial-gradient(circle, rgba(255,184,48,0.06) 0%, transparent 70%)",
            filter: "blur(100px)",
          }}
          animate={{ x: [0, -15, 25, 0], y: [0, 15, -10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* ─── Particles ─── */}
      <ParticleField />

      {/* ─── Content ─── */}
      <div className="relative z-10 flex flex-col items-center gap-5 px-6">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0, filter: "blur(10px)" }}
          animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
          transition={{ type: "spring", damping: 22, stiffness: 220, delay: 0.08 }}
        >
          <BrandLogo variant="full" size={68} />
        </motion.div>

        {/* Cue lines + dots */}
        <CueLines />

        {/* Tagline */}
        <motion.p
          className="text-center font-display text-xs tracking-[0.35em] uppercase"
          style={{ color: "var(--color-fg-muted)" }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          Outwit the board
        </motion.p>

        {/* Wave progression bar */}
        <div className="mt-2 flex flex-col items-center gap-2">
          <WaveBar duration={duration} />
          <ProgressNumber duration={duration} />
        </div>

        {/* Tap hint */}
        <motion.p
          className="text-[10px] font-mono tracking-[0.25em] uppercase"
          style={{ color: "var(--color-fg-faint)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0.4, 0.7, 0.4] }}
          transition={{ delay: 1.8, duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          Tap to continue
        </motion.p>
      </div>

      {/* Version */}
      <motion.p
        className="absolute bottom-7 text-[10px] font-mono"
        style={{ color: "var(--color-fg-faint)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        v2.0
      </motion.p>
    </motion.div>
  );
}
