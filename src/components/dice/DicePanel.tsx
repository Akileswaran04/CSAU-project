import { Dices } from "lucide-react";
import { Dice3D } from "./Dice3D";
import { useGameStore } from "../../store/useGameStore";

interface DicePanelProps {
  onRoll: () => void;
  isDisabled: boolean;
  variant?: "default" | "compact" | "floating";
}

export function DicePanel({ onRoll, isDisabled, variant = "default" }: DicePanelProps) {
  const { isRolling, teams, currentTeamIndex, gamePhase } = useGameStore();
  const currentTeam = teams[currentTeamIndex];

  const containerStyles = {
    default: "glass-panel-tinted p-5 rounded-2xl",
    compact: "glass-panel-tinted p-3 px-4 rounded-xl",
    floating: "glass-panel-tinted p-4 px-6 rounded-2xl",
  };

  const buttonStyles = {
    default: "px-8 py-3 text-base",
    compact: "px-5 py-2 text-sm",
    floating: "px-8 py-3 text-base",
  };

  return (
    <div className={`flex flex-col items-center ${containerStyles[variant]}`}>
      <Dice3D />
      <button
        onClick={onRoll}
        disabled={isDisabled}
        aria-label="Roll dice"
        className={`glass-button mt-3 flex items-center gap-2 font-display font-semibold transition-all ${
          buttonStyles[variant]
        } ${
          isDisabled
            ? "text-white/20 cursor-not-allowed"
            : "text-white hover:glow-jade"
        }`}
        style={
          !isDisabled
            ? {
                background: "var(--color-glass-jade-20)",
                borderColor: "var(--color-glass-jade-30)",
              }
            : undefined
        }
      >
        <Dices size={variant === "compact" ? 16 : 20} aria-hidden="true" />
        {isRolling ? "Rolling..." : "Roll Dice"}
      </button>
      {currentTeam && gamePhase === "active" && (
        <p className="text-white/35 text-xs mt-2 font-display">
          Current turn:{" "}
          <span className="text-white font-medium">{currentTeam.name}</span>
        </p>
      )}
    </div>
  );
}
