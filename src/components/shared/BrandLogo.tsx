import { type SVGProps } from "react";

interface BrandLogoProps extends SVGProps<SVGSVGElement> {
  variant?: "mark" | "full" | "wordmark";
  size?: number;
}

/**
 * Riddle Rush Brand Logo
 *
 * A steel blue "RR" monogram inspired by interlocking board-game paths
 * and the symmetrical structure of the game grid.
 *
 * Variants:
 *   - mark:      RR monogram only (default, 1:1 square)
 *   - full:      RR monogram + "RIDDLE RUSH" wordmark
 *   - wordmark:  "RIDDLE RUSH" text only
 */
function RRLetters() {
  return (
    <>
      {/* Outer ring — board game path reference */}
      <circle
        cx="20"
        cy="20"
        r="17.5"
        stroke="url(#jadeGradient)"
        strokeWidth="1.2"
        opacity="0.3"
      />

      {/* Left R — forged accent */}
      <path
        d="M10 26V10h6.5a4 4 0 0 1 4 4v1a4 4 0 0 1-2.8 3.8L21 26h-3.5l-3.5-7H14v7h-4Z"
        fill="#4C8DFF"
        opacity="0.9"
      />

      {/* Left R leg */}
      <rect x="13" y="16" width="3.5" height="3" rx="1" fill="#4C8DFF" opacity="0.7" />

      {/* Right R — inverted / mirrored */}
      <path
        d="M30 26V10h-6.5a4 4 0 0 0-4 4v1a4 4 0 0 0 2.8 3.8L19 26h3.5l3.5-7H26v7h4Z"
        fill="rgba(255,255,255,0.2)"
        opacity="0.9"
      />

      {/* Right R leg */}
      <rect x="23.5" y="16" width="3.5" height="3" rx="1" fill="rgba(255,255,255,0.15)" opacity="0.7" />
    </>
  );
}

function Wordmark({ size }: { size: number }) {
  return (
    <svg
      width={size * 2.4}
      height={size}
      viewBox="0 0 120 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Riddle Rush wordmark"
    >
      <text
        x="0"
        y="34"
        fontFamily="'Clash Display', 'General Sans', system-ui, sans-serif"
        fontSize="28"
        fontWeight="700"
        fill="#4C8DFF"
        letterSpacing="2"
      >
        RIDDLE
      </text>
      <text
        x="78"
        y="34"
        fontFamily="'Clash Display', 'General Sans', system-ui, sans-serif"
        fontSize="28"
        fontWeight="700"
        fill="rgba(255,255,255,0.3)"
        letterSpacing="2"
      >
        RUSH
      </text>
    </svg>
  );
}

export function BrandLogo({
  variant = "mark",
  size = 40,
  ...props
}: BrandLogoProps) {
  const markSize = Math.max(size, 24);
  const viewBox = 40;

  if (variant === "wordmark") {
    return <Wordmark size={size} />;
  }

  if (variant === "full") {
    return (
      <div className="flex items-center gap-2">
        <svg
          width={markSize}
          height={markSize}
          viewBox={`0 0 ${viewBox} ${viewBox}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Riddle Rush RR logo"
          {...props}
        >
          <RRLetters />
          <defs>
            <linearGradient id="jadeGradient" x1="0" y1="0" x2="40" y2="40">
              <stop offset="0%" stopColor="#6FA3FF" />
              <stop offset="50%" stopColor="#4C8DFF" />
              <stop offset="100%" stopColor="#3B7DEE" />
            </linearGradient>
          </defs>
        </svg>
        <Wordmark size={size} />
      </div>
    );
  }

  // Default: mark variant
  return (
    <svg
      width={markSize}
      height={markSize}
      viewBox={`0 0 ${viewBox} ${viewBox}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Riddle Rush RR logo"
      {...props}
    >
      <RRLetters />
      <defs>
        <linearGradient id="jadeGradient" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="#6FA3FF" />
          <stop offset="50%" stopColor="#4C8DFF" />
          <stop offset="100%" stopColor="#3B7DEE" />
        </linearGradient>
      </defs>
    </svg>
  );
}
