import {
  Sword,
  Shield,
  Crown,
  Zap,
  Target,
  Rocket,
  Flame,
  Star,
  type LucideIcon,
} from "lucide-react";
import type { TeamIcon } from "../../store/useGameStore";

/** Map of icon name strings → lucide components */
const iconMap: Record<TeamIcon, LucideIcon> = {
  sword: Sword,
  shield: Shield,
  crown: Crown,
  zap: Zap,
  target: Target,
  rocket: Rocket,
  flame: Flame,
  star: Star,
};

interface TeamIconDisplayProps {
  icon: TeamIcon;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/** Renders a team icon by name. Falls back to Star if unknown. */
export function TeamIconDisplay({ icon, size = 16, className, style }: TeamIconDisplayProps) {
  const Icon = iconMap[icon] || Star;
  return <Icon size={size} className={className} style={style} />;
}
