import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useSettingsStore } from "../store/useSettingsStore";

/* ─── Asset URLs ─── */
const BG_IMAGE_1 =
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260609_195923_b0ba8ace-1d1d-4f2c-9a28-1ab84b330680.png&w=1280&q=85";
const BG_IMAGE_2 =
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260609_201152_bba90a12-bf12-459f-91f0-51f237dbaf3b.png&w=1280&q=85";

/* ─── Constants ─── */
const SPOTLIGHT_R = 260;

/* ─── Cursor-following spotlight reveal — CSS radial gradient mask (GPU-accelerated) ─── */
function RevealLayer({ image }: { image: string }) {
  return (
    <div className="absolute inset-0 z-30 pointer-events-none">
      <div
        className="absolute inset-0 bg-center bg-cover bg-no-repeat"
        style={{
          backgroundImage: `url(${image})`,
          maskImage: "var(--spotlight-mask, radial-gradient(circle at -999px -999px, transparent 0%))",
          WebkitMaskImage: "var(--spotlight-mask, radial-gradient(circle at -999px -999px, transparent 0%))",
          maskSize: "100% 100%",
          WebkitMaskSize: "100% 100%",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
        }}
      />
    </div>
  );
}

/* ─── Hero Page ─── */
export function HeroPage() {
  const navigate = useNavigate();
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "volcanic" : "dark");
  }, [theme, setTheme]);

  // ─── Spotlight cursor tracking with smooth lerp (writes to CSS var — no React re-renders!) ───
  const mouseRef = useRef({ x: -999, y: -999 });
  const smoothRef = useRef({ x: -999, y: -999 });
  const rafRef = useRef<number>(0);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);

    const animate = () => {
      smoothRef.current.x += (mouseRef.current.x - smoothRef.current.x) * 0.1;
      smoothRef.current.y += (mouseRef.current.y - smoothRef.current.y) * 0.1;

      const sx = Math.round(smoothRef.current.x);
      const sy = Math.round(smoothRef.current.y);

      // Build a radial gradient for the mask — white = visible, transparent = hidden
      // Writing directly to a CSS custom property avoids React re-renders entirely
      const stops = [
        "rgba(255,255,255,1) 0%",
        "rgba(255,255,255,1) 40%",
        "rgba(255,255,255,0.75) 60%",
        "rgba(255,255,255,0.4) 75%",
        "rgba(255,255,255,0.12) 88%",
        "rgba(255,255,255,0) 100%",
      ].join(", ");

      document.documentElement.style.setProperty(
        "--spotlight-mask",
        `radial-gradient(${SPOTLIGHT_R}px at ${sx}px ${sy}px, ${stops})`
      );

      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rafRef.current);
      document.documentElement.style.removeProperty("--spotlight-mask");
    };
  }, [handleMouseMove]);

  return (
    <div
      className="min-h-screen tracking-[-0.02em]"
      style={{
        fontFamily: "'Inter', sans-serif",
        backgroundColor: "var(--color-bg-base)",
      }}
    >
      {/* ─── Fixed Navigation ─── */}
      <nav
        className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between p-4 sm:p-5"
        style={{ "--color-white": "#fff" } as React.CSSProperties}
      >
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <svg width="26" height="26" viewBox="0 0 256 256" fill="#ffffff">
            <path d="M 256 256 L 128 256 L 0 128 L 128 128 Z M 256 128 L 128 128 L 0 0 L 128 0 Z" />
          </svg>
          <span className="text-white text-2xl font-playfair italic">Riddle Rush</span>
        </div>

        {/* Center: Nav Pill (desktop) */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-2 py-2 items-center gap-1">
          <button
            onClick={() => navigate("/setup")}
            className="text-white px-4 py-1.5 rounded-full text-sm font-medium bg-white/20"
          >
            Setup
          </button>
          <button
            onClick={() => navigate("/board")}
            className="text-white/80 hover:bg-white/20 hover:text-white transition-colors px-4 py-1.5 rounded-full text-sm font-medium"
          >
            Board
          </button>
          <button
            onClick={() => navigate("/spectate")}
            className="text-white/80 hover:bg-white/20 hover:text-white transition-colors px-4 py-1.5 rounded-full text-sm font-medium"
          >
            Spectate
          </button>
          <button
            onClick={() => navigate("/leaderboard")}
            className="text-white/80 hover:bg-white/20 hover:text-white transition-colors px-4 py-1.5 rounded-full text-sm font-medium"
          >
            Leaderboard
          </button>
        </div>

        {/* Right: Theme toggle + Play Now (desktop) */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white p-2.5 rounded-full transition-all hover:scale-105 active:scale-95"
            aria-label={theme === "dark" ? "Switch to volcanic theme" : "Switch to dark theme"}
            title={theme === "dark" ? "Volcanic theme" : "Dark theme"}
          >
            {theme === "dark" ? (
              <Sun size={16} aria-hidden="true" />
            ) : (
              <Moon size={16} aria-hidden="true" />
            )}
          </button>
          <button
            className="bg-white text-gray-900 text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-gray-100 transition-colors"
            onClick={() => navigate("/setup")}
          >
            Play Now
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* ─── Hero Section ─── */}
      <section
        className="relative w-full overflow-hidden h-screen bg-black"
        style={{
          height: "100dvh",
          // Restore white for hero text on dark background
          "--color-white": "#fff",
        } as React.CSSProperties}
      >
        {/* Layer 1: Base image (z-10) with Ken Burns zoom-out */}
        <div
          className="absolute inset-0 bg-center bg-cover bg-no-repeat hero-zoom z-10"
          style={{ backgroundImage: `url(${BG_IMAGE_1})` }}
        />

        {/* Layer 2: Spotlight reveal (z-30) — CSS mask, GPU-accelerated, no canvas! */}
        <RevealLayer image={BG_IMAGE_2} />

        {/* Layer 3: Heading (z-50) */}
        <div className="absolute top-[14%] left-0 right-0 flex flex-col items-center text-center px-5 pointer-events-none z-50">
          <h1 className="text-white leading-[0.95]">
            <span
              className="block font-playfair italic font-normal text-5xl sm:text-7xl md:text-8xl hero-anim hero-reveal"
              style={{ letterSpacing: "-0.05em", animationDelay: "0.25s" }}
            >
              Outwit the
            </span>
            <span
              className="block font-normal text-5xl sm:text-7xl md:text-8xl -mt-1 hero-anim hero-reveal"
              style={{ letterSpacing: "-0.08em", animationDelay: "0.42s" }}
            >
              Board Rush
            </span>
          </h1>
        </div>

        {/* Layer 4: Bottom-left description (z-50) */}
        <div
          className="hidden sm:block absolute bottom-14 left-10 md:left-14 max-w-[260px] z-50 hero-anim hero-fade"
          style={{ animationDelay: "0.7s" }}
        >
          <p className="text-sm text-white/80 leading-relaxed">
            Roll the dice, solve riddles, and race your team across the board.
            Every cell holds a challenge — every turn is a gamble.
          </p>
        </div>

        {/* Layer 5: Bottom-right CTA (z-50) */}
        <div
          className="absolute bottom-10 sm:bottom-24 left-5 right-5 sm:left-auto sm:right-10 md:right-14 max-w-full sm:max-w-[260px] flex flex-col items-start gap-4 sm:gap-5 z-50 hero-anim hero-fade"
          style={{ animationDelay: "0.85s" }}
        >
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Challenge your friends in a fast-paced trivia race. Solve riddles,
            climb the leaderboard, and claim the crown.
          </p>
          <button
            onClick={() => navigate("/setup")}
            className="bg-[#e8702a] hover:bg-[#d2611f] text-white text-sm font-medium px-7 py-3 rounded-full transition-all hover:scale-[1.03] active:scale-95 hover:shadow-lg hover:shadow-[#e8702a]/30"
          >
            Start Game
          </button>
        </div>
      </section>

      {/* ─── Mobile menu overlay ─── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-lg flex flex-col items-center justify-center gap-6 md:hidden">
          {[
            { label: "Setup", path: "/setup" },
            { label: "Board", path: "/board" },
            { label: "Spectate", path: "/spectate" },
            { label: "Leaderboard", path: "/leaderboard" },
          ].map(({ label, path }) => (
            <button
              key={label}
              className="text-white text-2xl font-medium hover:text-white/70 transition-colors"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate(path);
              }}
            >
              {label}
            </button>
          ))}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => {
                toggleTheme();
              }}
              className="bg-white/15 hover:bg-white/25 border border-white/30 text-white p-3 rounded-full transition-all"
              aria-label={theme === "dark" ? "Switch to volcanic theme" : "Switch to dark theme"}
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              className="bg-white text-gray-900 text-sm font-semibold px-8 py-3 rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/setup");
              }}
            >
              Play Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
