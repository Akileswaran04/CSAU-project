import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScrollText,
  Dices,
  Brain,
  AlertTriangle,
  Trophy,
  Move,
  Filter,
} from "lucide-react";
import { useLogStore } from "../../store/useLogStore";
import { useGameStore } from "../../store/useGameStore";
import { PanelShell } from "../shared/PanelShell";

const typeIcons = {
  roll: Dices,
  riddle: Brain,
  movement: Move,
  forced: AlertTriangle,
  system: Trophy,
  score: Trophy,
};

const typeColors = {
  roll: "text-jade",
  riddle: "text-accent-gold",
  movement: "text-accent-success",
  forced: "text-danger",
  system: "text-accent-gold",
  score: "text-accent-success",
};

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function ActionLog() {
  const entries = useLogStore((s) => s.entries);
  const teams = useGameStore((s) => s.teams);
  const [filterTeam, setFilterTeam] = useState<string | null>(null);

  const filteredEntries = useMemo(() => {
    if (!filterTeam) return entries;
    return entries.filter(
      (e) => e.teamId === filterTeam || e.teamName === "system"
    );
  }, [entries, filterTeam]);

  return (
    <PanelShell
      title="Action Log"
      action={
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-white/30" />
          <select
            value={filterTeam || ""}
            onChange={(e) => setFilterTeam(e.target.value || null)}
            className="glass-input text-xs !py-1 !px-2 !rounded-lg"
          >
            <option value="">All Teams</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      }
    >
      <div className="max-h-[400px] overflow-y-auto space-y-2" role="log" aria-live="polite" aria-label="Game action log">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-8">
            <ScrollText size={24} className="mx-auto text-white/15 mb-2" />
            <p className="text-white/25 text-sm font-display">No events yet</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filteredEntries.map((entry) => {
              const Icon = typeIcons[entry.type];
              const color = typeColors[entry.type];
              const teamColor = teams.find(
                (t) => t.id === entry.teamId
              )?.color;

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors"
                >
                  <div
                    className={`p-1.5 rounded-lg bg-white/[0.04] ${color}`}
                  >
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {teamColor && (
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: teamColor }}
                        />
                      )}
                      <span
                        className="text-white/70 text-sm font-display font-medium truncate"
                        style={teamColor ? { color: teamColor + "cc" } : undefined}
                      >
                        {entry.teamName}
                      </span>
                    </div>
                    <p className="text-white/40 text-xs mt-0.5">
                      {entry.message}
                    </p>
                  </div>
                  <span className="text-white/15 text-xs shrink-0 font-mono">
                    {formatTime(entry.timestamp)}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </PanelShell>
  );
}
