import { Dices } from "lucide-react";
import { Dice3D } from "./Dice3D";
import { useGameStore } from "../../store/useGameStore";
import { TeamIconDisplay } from "../shared/TeamIconDisplay";
import { Button } from "../ui/button";

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

  const buttonSize = variant === "compact" ? "sm" as const : "lg" as const;

  return (
    <div className={`flex flex-col items-center ${containerStyles[variant]}`}>
      <Dice3D />
      <Button
        onClick={onRoll}
        disabled={isDisabled}
        variant="primary"
        size={buttonSize}
        aria-label="Roll dice"
        className={`mt-3 ${variant === "compact" ? "px-5" : "px-8"}`}
      >
        <Dices size={variant === "compact" ? 16 : 20} aria-hidden="true" />
        {isRolling ? "Rolling..." : "Roll Dice"}
      </Button>
      {currentTeam && gamePhase === "active" && (
        <div className="flex items-center gap-1.5 text-fg-muted text-xs mt-2 font-display">
          <span>Current turn:</span>
          <div
            className="w-4 h-4 rounded flex items-center justify-center"
            style={{
              backgroundColor: currentTeam.color + "20",
              border: `1px solid ${currentTeam.color}40`,
              color: currentTeam.color,
            }}
          >
            <TeamIconDisplay icon={currentTeam.icon} size={8} />
          </div>
          <span className="text-white font-medium">{currentTeam.name}</span>
        </div>
      )}
    </div>
  );
}
