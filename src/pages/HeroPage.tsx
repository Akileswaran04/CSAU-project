import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, X } from "lucide-react";

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

/* ─── Nav Links ─── */
const navItems = ["Story", "Expertise", "Studios", "Feedback"];

/* ─── Stats Data ─── */
const statItems = [
  { number: "300", label: "CRAFTED\nBRANDS" },
  { number: "200", label: "DIGITAL\nPRODUCTS" },
  { number: "100", label: "VENTURES\nFUNDED" },
];

/* ═══════════════════════════════════════════════════════════════════════════
   HERO PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
export function HeroPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const accentColor = "var(--color-accent-primary)";

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
          <motion.div
            variants={fadeDown}
            initial="hidden"
            animate="visible"
            custom={0}
            className="w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0"
            style={{ borderColor: accentColor }}
          >
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accentColor }} />
          </motion.div>

          {/* Center: Nav Links (hidden mobile) */}
          <div className="hidden md:flex items-center gap-10">
            {navItems.map((item, i) => (
              <motion.span
                key={item}
                variants={fadeDown}
                initial="hidden"
                animate="visible"
                custom={i + 1}
                className="text-sm font-semibold tracking-widest uppercase cursor-pointer hover:opacity-70 transition-opacity"
              >
                {item}
              </motion.span>
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
              Shaping Bold<br />Visions Into Power<br />For Your Tribe
            </motion.p>
            <motion.a
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={6}
              href="/setup"
              onClick={(e) => { e.preventDefault(); navigate("/setup"); }}
              className="inline-flex items-center gap-1.5 whitespace-nowrap font-semibold cursor-pointer hover:opacity-80 transition-opacity"
              style={{
                color: accentColor,
                fontSize: "clamp(1rem, 2.5vw, 1.5rem)",
              }}
            >
              Work With Us
              <ArrowUpRight size={18} className="sm:w-[22px] sm:h-[22px]" />
            </motion.a>
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
                Creative Studios Built Around Elevating Your Vision Into Striking Reality
              </p>
            </motion.div>

            {/* Main Heading — 3 words stacked */}
            <div className="text-right">
              {["Fearless", "Vision", "Delivered"].map((word, i) => (
                <div key={word} className="overflow-hidden">
                  <motion.span
                    variants={wordReveal}
                    initial="hidden"
                    animate="visible"
                    custom={i}
                    className="block font-semibold uppercase leading-[0.88]"
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
              <div
                className="w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0"
                style={{ borderColor: accentColor }}
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accentColor }} />
              </div>
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
                <span
                  key={item}
                  className="text-3xl font-semibold tracking-widest uppercase cursor-pointer hover:opacity-70 transition-opacity"
                  style={{ color: "var(--color-fg-default)" }}
                >
                  {item}
                </span>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="mt-auto">
              <button
                onClick={() => { setMenuOpen(false); navigate("/setup"); }}
                className="inline-flex items-center gap-2 text-xl font-semibold cursor-pointer hover:opacity-80 transition-opacity"
                style={{ color: accentColor }}
              >
                Work With Us
                <ArrowUpRight size={22} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
