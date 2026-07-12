/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        /* ── Surface Tones ── */
        ink: {
          900: "#07080A",
          800: "#0B0E13",
          700: "#11151C",
          600: "#1A1F28",
          500: "#242A36",
        },
        /* ── Backgrounds ── */
        bg: {
          base: "#0B0E13",
          surface: "#11151C",
          elevated: "#1A1F28",
        },
        /* ── Glass System ── */
        glass: {
          tint: "rgba(76, 141, 255, 0.04)",
          light: "rgba(255, 255, 255, 0.03)",
          medium: "rgba(255, 255, 255, 0.06)",
          heavy: "rgba(255, 255, 255, 0.10)",
          border: "rgba(255, 255, 255, 0.08)",
        },
        /* ── Steel Blue (Primary) ── */
        steel: {
          DEFAULT: "#4C8DFF",
          hover: "#6FA3FF",
          muted: "rgba(76, 141, 255, 0.15)",
          glow: "rgba(76, 141, 255, 0.4)",
        },
        /* ── Semantic Accents ── */
        accent: {
          primary: "#4C8DFF",
          success: "#3FBF7F",
          danger: "#E5484D",
          gold: "#E8B94E",
          silver: "#A0AEC0",
          bronze: "#CD7F32",
        },
        /* ── Difficulty Colors ── */
        diff: {
          easy: "#3FBF7F",
          medium: "#F2994A",
          hard: "#E5484D",
        },
        /* Aliases for backward compatibility */
        lime: {
          DEFAULT: "#3FBF7F",
          muted: "rgba(63, 191, 127, 0.15)",
        },
        crimson: {
          DEFAULT: "#E5484D",
          muted: "rgba(229, 72, 77, 0.15)",
        },
        gold: {
          DEFAULT: "#E8B94E",
          muted: "rgba(232, 185, 78, 0.15)",
        },
        silver: "#A0AEC0",
        bronze: "#CD7F32",
      },
      fontFamily: {
        display: ['"Clash Display"', '"General Sans"', "system-ui", "sans-serif"],
        body: ['"General Sans"', "Inter", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', '"Fira Code"', "monospace"],
      },
      backdropBlur: {
        glass: "24px",
      },
      boxShadow: {
        glass: "0 8px 40px -8px rgba(0, 0, 0, 0.5)",
        "glass-tinted": "0 8px 40px -8px rgba(76, 141, 255, 0.1)",
        "glow-steel": "0 0 40px rgba(76, 141, 255, 0.2)",
        "glow-lime": "0 0 40px rgba(63, 191, 127, 0.2)",
        "glow-crimson": "0 0 40px rgba(229, 72, 77, 0.2)",
        "glow-gold": "0 0 40px rgba(232, 185, 78, 0.2)",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(76, 141, 255, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(76, 141, 255, 0.6)" },
        },
        "forced-alarm": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(229, 72, 77, 0.4)" },
          "50%": { boxShadow: "0 0 50px rgba(229, 72, 77, 0.7)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "forced-alarm": "forced-alarm 0.5s ease-in-out infinite",
        "slide-up": "slide-up 0.4s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
