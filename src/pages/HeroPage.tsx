import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, X, Play } from "lucide-react";
import { BrandLogo } from "../components/shared/BrandLogo";
import { Button } from "../components/ui/button";

/* ─── Framer Motion Variants ─── */
const fadeDown = {
  hidden: { opacity: 0, y: -20 },
  visible: (custom = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: custom * 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (custom = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: custom * 0.12, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const wordReveal = {
  hidden: { y: "110%" },
  visible: (custom = 0) => ({
    y: 0,
    transition: { duration: 0.7, delay: 0.4 + custom * 0.14, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const navItems = [
  { label: "Setup", path: "/setup" },
  { label: "Board", path: "/board" },
  { label: "Spectate", path: "/spectate" },
  { label: "Leaderboard", path: "/leaderboard" },
];

const statItems = [
  { number: "32", label: "BOARD\nCELLS" },
  { number: "10", label: "RIDDLE\nSQUARES" },
  { number: "24", label: "BRAIN\nTEASERS" },
];

export function HeroPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const accentColor = "var(--color-accent-primary)";

  const goTo = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <div className="relative min-h-screen overflow-hidden font-['Inter',sans-serif]">
      {/* ─── Background Video ─── */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080'%3E%3Crect fill='%230B0E13' width='1920' height='1080'/%3E%3C/svg%3E"
      >
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260517_222138_3e3205be-3364-417b-a64a-bfe087acbec4.mp4"
          type="video/mp4"
        />
      </video>

      {/* ─── Scrim Overlay ─── */}
      <div className="absolute inset-0 pointer-events-none bg-black/30" />

      {/* ─── Content Container ─── */}
      <div className="relative z-10 flex flex-col min-h-screen" style={{ color: "var(--color-fg-default)" }}>
        {/* ══════ NAV ══════ */}
        <nav className="flex items-center justify-between px-5 sm:px-8 md:px-12 pt-5 md:pt-6">
          {/* Left: Logo */}
          <motion.button
            variants={fadeDown}
            initial="hidden"
            animate="visible"
            custom={0}
            onClick={() => navigate("/")}
            className="shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            aria-label="Riddle Rush home"
          >
            <BrandLogo size={32} />
          </motion.button>

          {/* Center: Nav Links (hidden mobile) */}
          <div className="hidden md:flex items-center gap-10">
            {navItems.map((item, i) => (
              <motion.button
                key={item.label}
                variants={fadeDown}
                initial="hidden"
                animate="visible"
                custom={i + 1}
                onClick={() => goTo(item.path)}
                className="text-sm font-semibold tracking-widest uppercase cursor-pointer hover:opacity-70 transition-opacity"
              >
                {item.label}
              </motion.button>
            ))}
          </div>

          {/* Right: Hamburger */}
          <motion.button
            variants={fadeDown}
            initial="hidden"
            animate="visible"
            custom={5}
            onClick={() => setMenuOpen(true)}
            className="w-9 h-9 rounded-full bg-white flex items-center justify-center gap-[3px] flex-col cursor-pointer hover:opacity-80 transition-opacity"
            style={{ backgroundColor: "var(--color-fg-default)" }}
            aria-label="Open menu"
          >
            <span className="w-4 h-[2px] rounded-full" style={{ backgroundColor: "var(--color-bg-base)" }} />
            <span className="w-4 h-[2px] rounded-full" style={{ backgroundColor: "var(--color-bg-base)" }} />
            <span className="w-4 h-[2px] rounded-full" style={{ backgroundColor: "var(--color-bg-base)" }} />
          </motion.button>
        </nav>

        {/* ══════ STATS ROW (flex-1, centered) ══════ */}
        <div className="flex-1 flex items-center justify-end px-5 sm:px-8 md:px-12 py-8 md:py-0">
          <div className="flex items-center gap-5 sm:gap-8 md:gap-10">
            {statItems.map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={i + 2}
                className="text-right"
              >
                <div className="flex items-start justify-end">
                  <span
                    className="text-[0.5em] leading-none font-semibold mr-0.5 mt-1"
                    style={{ color: accentColor }}
                  >
                    +
                  </span>
                  <span
                    className="font-semibold leading-none"
                    style={{
                      fontSize: "clamp(1.5rem, 5vw, 3.5rem)",
                      color: "var(--color-fg-default)",
                    }}
                  >
                    {stat.number}
                  </span>
                </div>
                <p
                  className="text-[10px] sm:text-xs md:text-sm font-semibold tracking-widest uppercase whitespace-pre-line leading-tight"
                  style={{ color: "var(--color-fg-muted)" }}
                >
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ══════ BOTTOM CONTENT ══════ */}
        <div className="px-5 sm:px-8 md:px-12 pb-8 md:pb-12 flex flex-col gap-6 md:gap-12">
          {/* Row A: Tagline + CTA */}
          <div className="flex items-center justify-between gap-4">
            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={5}
              className="text-[10px] sm:text-xs md:text-sm font-semibold tracking-widest uppercase max-w-[130px] sm:max-w-[160px] md:max-w-xs"
              style={{ color: "var(--color-fg-muted)" }}
            >
              Outwit<br />The Board<br />Win The Race
            </motion.p>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={6}
            >
              <Button
                variant="primary"
                size="lg"
                onClick={() => goTo("/setup")}
                className="text-lg sm:text-xl px-6 sm:px-8 py-3 sm:py-4"
              >
                <Play size={22} />
                Start Game
                <ArrowUpRight size={20} />
              </Button>
            </motion.div>
          </div>

          {/* Row B: Description + Main Heading */}
          <div className="flex items-end justify-between gap-3 sm:gap-4">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={7}
              className="w-[120px] sm:w-[180px] md:w-[280px] shrink-0"
            >
              <p
                className="text-[9px] sm:text-xs md:text-sm font-semibold tracking-widest uppercase text-left md:text-right"
                style={{ color: "var(--color-fg-muted)" }}
              >
                Roll the dice, solve riddles, and race your team to the finish line
              </p>
            </motion.div>

            {/* Main Heading — 3 words stacked */}
            <div className="text-right">
              {["Riddle", "Rush", "Play"].map((word, i) => (
                <div key={word} className="overflow-hidden">
                  <motion.span
                    variants={wordReveal}
                    initial="hidden"
                    animate="visible"
                    custom={i}
                    className="block font-display font-semibold uppercase leading-[0.88]"
                    style={{
                      fontSize: "clamp(2rem, 9vw, 9rem)",
                      color: "var(--color-fg-default)",
                    }}
                  >
                    {word}
                  </motion.span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════ MOBILE MENU OVERLAY ══════ */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex flex-col p-5 sm:p-8 md:p-12"
            style={{ backgroundColor: "var(--color-bg-base)" }}
          >
            {/* Top row: logo + close */}
            <div className="flex items-center justify-between">
              <BrandLogo size={32} />
              <button
                onClick={() => setMenuOpen(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                style={{ backgroundColor: "var(--color-fg-default)" }}
                aria-label="Close menu"
              >
                <X size={18} style={{ color: "var(--color-bg-base)" }} />
              </button>
            </div>

            {/* Nav links */}
            <div className="flex flex-col gap-8 mt-16">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => goTo(item.path)}
                  className="text-3xl font-semibold tracking-widest uppercase cursor-pointer hover:opacity-70 transition-opacity text-left"
                  style={{ color: "var(--color-fg-default)" }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="mt-auto">
              <Button
                variant="primary"
                size="lg"
                onClick={() => goTo("/setup")}
              >
                <Play size={20} />
                Start Game
                <ArrowUpRight size={20} />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
