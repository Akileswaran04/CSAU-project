/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        /* ── Ink Surface Tones ── */
        ink: {
          900: "#070809",
          800: "#0B0D0E",
          700: "#111415",
          600: "#181C1E",
          500: "#1E2325",
        },
        /* ── Backgrounds ── */
        bg: {
          base: "#0B0D0E",
          surface: "#111415",
          elevated: "#181C1E",
        },
        /* ── Glass System ── */
        glass: {
          tint: "rgba(255, 122, 69, 0.04)",
          light: "rgba(255, 255, 255, 0.03)",
          medium: "rgba(255, 255, 255, 0.06)",
          heavy: "rgba(255, 255, 255, 0.1)",
          border: "rgba(255, 255, 255, 0.08)",
        },
        /* ── Copper / Amber ── */
        copper: {
          DEFAULT: "#FF7A45",
          hover: "#FF9A6C",
          muted: "rgba(255, 122, 69, 0.15)",
          glow: "rgba(255, 122, 69, 0.4)",
        },
        /* ── Semantic Accents ── */
        accent: {
          primary: "#FF7A45",
          success: "#C6F135",
          danger: "#E11D3C",
          gold: "#FFB830",
          silver: "#A0AEC0",
          bronze: "#CD7F32",
        },
        /* ── Difficulty Colors ── */
        diff: {
          easy: "#C6F135",
          medium: "#FFB830",
          hard: "#E11D3C",
        },
        /* Aliases for backward compatibility */
        lime: {
          DEFAULT: "#C6F135",
          muted: "rgba(198, 241, 53, 0.15)",
        },
        crimson: {
          DEFAULT: "#E11D3C",
          muted: "rgba(225, 29, 60, 0.15)",
        },
        gold: {
          DEFAULT: "#FFB830",
          muted: "rgba(255, 184, 48, 0.15)",
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
        "glass-tinted": "0 8px 40px -8px rgba(255, 122, 69, 0.1)",
        "glow-copper": "0 0 40px rgba(255, 122, 69, 0.2)",
        "glow-lime": "0 0 40px rgba(198, 241, 53, 0.2)",
        "glow-crimson": "0 0 40px rgba(225, 29, 60, 0.2)",
        "glow-gold": "0 0 40px rgba(255, 184, 48, 0.2)",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(255, 122, 69, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(255, 122, 69, 0.6)" },
        },
        "forced-alarm": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(225, 29, 60, 0.4)" },
          "50%": { boxShadow: "0 0 50px rgba(225, 29, 60, 0.7)" },
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
