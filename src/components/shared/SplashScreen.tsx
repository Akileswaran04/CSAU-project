import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { BrandLogo } from "./BrandLogo";
import { sounds } from "../../lib/sound";

interface SplashScreenProps {
  /** Duration in ms before auto-dismiss. Default 3200. */
  duration?: number;
  /** Called when the splash screen finishes. */
  onFinish: () => void;
}

/**
 * Riddle Rush branded splash screen.
 *
 * Shown on app launch: displays the full brand logo (mark + wordmark),
 * the tagline "Outwit the board", and a subtle animated jade gradient
 * background. Auto-dismisses after `duration` ms, or dismisses immediately
 * on any pointer click or keyboard press.
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
  // Uses a ref to prevent race: if we used state here, setDismissed(true)
  // would change a dependency, trigger effect cleanup, and cancel the timeout.
  useEffect(() => {
    if (phase === "exit" && !exitHandled.current) {
      exitHandled.current = true;
      const t = setTimeout(() => onFinish(), 600);
      return () => clearTimeout(t);
    }
  }, [phase, onFinish]);

  // Immediate dismiss on any interaction
  // Also plays the chime on first gesture (satisfies browser autoplay policy)
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
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "var(--color-bg-base)",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: phase === "exit" ? 0 : 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Animated jade gradient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute rounded-full blur-[120px]"
          style={{
            width: "min(60vw, 500px)",
            height: "min(60vw, 500px)",
            top: "10%",
            left: "5%",
            background:
              "radial-gradient(circle, rgba(47,217,168,0.12) 0%, transparent 70%)",
          }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -20, 30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute rounded-full blur-[120px]"
          style={{
            width: "min(50vw, 400px)",
            height: "min(50vw, 400px)",
            bottom: "15%",
            right: "5%",
            background:
              "radial-gradient(circle, rgba(255,184,48,0.06) 0%, transparent 70%)",
          }}
          animate={{
            x: [0, -20, 30, 0],
            y: [0, 20, -10, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6">
        {/* Logo mark + wordmark */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, filter: "blur(12px)" }}
          animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
          transition={{
            type: "spring",
            damping: 20,
            stiffness: 200,
            delay: 0.1,
          }}
        >
          <BrandLogo variant="full" size={72} />
        </motion.div>

        {/* Tagline */}
        <motion.p
          className="text-center font-display text-sm tracking-[0.3em] uppercase"
          style={{ color: "var(--color-fg-muted)" }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          Outwit the board
        </motion.p>

        {/* Loading bar */}
        <motion.div
          className="mt-4 h-[2px] rounded-full overflow-hidden"
          style={{
            width: 160,
            background: "var(--color-glass-white-06)",
          }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: "var(--color-accent-primary)" }}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{
              duration: duration / 1000 - 0.5,
              delay: 0.4,
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* Tap to continue hint */}
        <motion.p
          className="text-[10px] font-mono tracking-wider uppercase"
          style={{ color: "var(--color-fg-faint)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.8 }}
        >
          Tap anywhere to continue
        </motion.p>
      </div>

      {/* Version */}
      <motion.p
        className="absolute bottom-8 text-[10px] font-mono"
        style={{ color: "var(--color-fg-faint)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        v2.0
      </motion.p>
    </motion.div>
  );
}
