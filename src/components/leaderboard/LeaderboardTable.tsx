import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Brain, Target, AlertTriangle } from "lucide-react";
import { useGameStore, type Team } from "../../store/useGameStore";
import { TeamIconDisplay } from "../shared/TeamIconDisplay";
import { PanelShell } from "../shared/PanelShell";
import { RULES } from "../../data/boardConfig";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

interface RankBadgeProps {
  rank: number;
}

function RankBadge({ rank }: RankBadgeProps) {
  const styles = [
    // Gold
    {
      bg: "rgba(255, 184, 48, 0.12)",
      border: "rgba(255, 184, 48, 0.3)",
      color: "#FFB830",
    },
    // Silver
    {
      bg: "rgba(160, 174, 192, 0.12)",
      border: "rgba(160, 174, 192, 0.3)",
      color: "#A0AEC0",
    },
    // Bronze
    {
      bg: "rgba(205, 127, 50, 0.12)",
      border: "rgba(205, 127, 50, 0.3)",
      color: "#CD7F32",
    },
  ];

  if (rank < 3) {
    const s = styles[rank];
    return (
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center"
        style={{
          background: s.bg,
          border: `1px solid ${s.border}`,
        }}
      >
        <Trophy size={16} style={{ color: s.color }} />
      </div>
    );
  }

  return (
    <div className="w-8 h-8 rounded-xl bg-white/[0.03] flex items-center justify-center">
      <span className="text-fg-subtle text-sm font-mono font-bold">
        {rank + 1}
      </span>
    </div>
  );
}

interface ScoreSparklineProps {
  history: number[];
  color: string;
}

function ScoreSparkline({ history, color }: ScoreSparklineProps) {
  if (history.length < 2) return null;

  const data = history.map((score, i) => ({ turn: i + 1, score }));

  return (
    <div className="w-20 h-10">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="turn" hide />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-bg-surface)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "8px",
              fontSize: "12px",
              fontFamily: "JetBrains Mono",
            }}
            labelStyle={{ color: "rgba(255,255,255,0.4)" }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke={color}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ForcedRiddleDots({
  current,
  threshold,
}: {
  current: number;
  threshold: number;
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: threshold }, (_, i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full transition-all ${
            i < current
              ? i >= threshold - 1
                ? "bg-danger animate-pulse"
                : "bg-accent-gold"
              : "bg-white/[0.06]"
          }`}
        />
      ))}
      {current >= threshold && (
        <AlertTriangle size={10} className="text-danger ml-0.5" />
      )}
    </div>
  );
}

function TeamRow({ team, rank }: { team: Team; rank: number }) {
  const correctRate =
    team.riddlesAttempted > 0
      ? Math.round((team.riddlesCorrect / team.riddlesAttempted) * 100)
      : 0;

  const forcedRiddleProgress = team.consecutiveNonRiddleTurns;
  const isNearForced = forcedRiddleProgress >= RULES.forcedRiddleThreshold - 1;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ type: "spring", damping: 25, stiffness: 250 }}
      className={`glass-panel flex items-center gap-4 p-4 ${
        isNearForced
          ? "animate-forced-alarm"
          : ""
      }`}
      style={
        isNearForced
          ? { background: "rgba(225, 29, 60, 0.06)", borderColor: "rgba(225, 29, 60, 0.2)" }
          : undefined
      }
    >
      <RankBadge rank={rank} />

      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{
          backgroundColor: team.color + "20",
          border: `1px solid ${team.color}40`,
          color: team.color,
        }}
      >
        <TeamIconDisplay icon={team.icon} size={16} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-white font-display font-medium text-sm truncate">
            {team.name}
          </p>
          {forcedRiddleProgress > 0 && (
            <ForcedRiddleDots
              current={forcedRiddleProgress}
              threshold={RULES.forcedRiddleThreshold}
            />
          )}
        </div>
        <p className="text-white/30 text-xs font-mono">
          Cell {Math.min(team.position + 1, 32)}
        </p>
      </div>

      <div className="hidden md:flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-white/40 text-xs font-mono">
          <Brain size={12} />
          {team.riddlesAttempted}
        </div>
        <div className="flex items-center gap-1.5 text-accent-success text-xs font-mono">
          <Target size={12} />
          {correctRate}%
        </div>
        <ScoreSparkline history={team.scoreHistory} color={team.color} />
      </div>

      <div className="text-right">
        <p className="text-white font-mono font-bold text-lg">{team.score}</p>
        <p className="text-white/30 text-xs font-mono">pts</p>
      </div>
    </motion.div>
  );
}

export function LeaderboardTable() {
  const teams = useGameStore((s) => s.teams);

  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => {
      if (b.position !== a.position) return b.position - a.position;
      return b.score - a.score;
    });
  }, [teams]);

  if (teams.length === 0) {
    return (
      <PanelShell>
        <div className="text-center py-8">
          <Trophy size={32} className="mx-auto text-white/15 mb-2" />
          <p className="text-white/30 text-sm font-display">No teams to display</p>
        </div>
      </PanelShell>
    );
  }

  return (
    <PanelShell title="Leaderboard" className="min-h-[400px]">
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {sortedTeams.map((team, index) => (
            <TeamRow key={team.id} team={team} rank={index} />
          ))}
        </AnimatePresence>
      </div>
    </PanelShell>
  );
}

export function LeaderboardFullPage() {
  const teams = useGameStore((s) => s.teams);
  const winner = useGameStore((s) => s.winner);
  const gamePhase = useGameStore((s) => s.gamePhase);

  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => {
      if (b.position !== a.position) return b.position - a.position;
      return b.score - a.score;
    });
  }, [teams]);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-white">
            {gamePhase === "ended" && winner
              ? "🏆 Final Standings"
              : "Live Leaderboard"}
          </h1>
          <p className="text-white/40 mt-1">
            {gamePhase === "ended"
              ? "The game has ended — here are the final results"
              : "Real-time rankings — sorted by position, then score"}
          </p>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {sortedTeams.map((team, index) => (
              <motion.div
                key={team.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  damping: 20,
                  stiffness: 200,
                  delay: index * 0.05,
                }}
                className={`glass-panel p-5 ${
                  winner?.id === team.id ? "glass-panel-tinted" : ""
                }`}
                style={
                  winner?.id === team.id
                    ? {
                        borderColor: "rgba(255, 184, 48, 0.2)",
                        boxShadow: "0 0 40px rgba(255, 184, 48, 0.1)",
                      }
                    : undefined
                }
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center font-display font-bold text-xl ${
                      index === 0
                        ? "ring-2 ring-accent-gold/40"
                        : ""
                    }`}
                    style={{
                      backgroundColor: team.color + "20",
                      border: `1px solid ${team.color}40`,
                      color: team.color,
                    }}
                  >
                    <TeamIconDisplay icon={team.icon} size={26} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-display font-bold text-white">
                        {team.name}
                      </h3>
                      {index === 0 && (
                        <span className="text-lg">👑</span>
                      )}
                    </div>
                    <p className="text-white/40 text-sm">
                      {team.participants.map((p) => p.name).join(" & ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-white/30 text-xs uppercase tracking-wider font-mono">
                        Position
                      </p>
                      <p className="text-white font-mono font-bold text-lg">
                        {team.position + 1}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-white/30 text-xs uppercase tracking-wider font-mono">
                        Riddles
                      </p>
                      <p className="text-white font-mono font-bold text-lg">
                        {team.riddlesAttempted}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-white/30 text-xs uppercase tracking-wider font-mono">
                        Score
                      </p>
                      <p className="text-white font-mono font-bold text-2xl">
                        {team.score}
                      </p>
                    </div>
                  </div>
                </div>

                {team.scoreHistory.length > 1 && (
                  <div className="mt-4 h-16">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={team.scoreHistory.map((s, i) => ({
                          turn: i + 1,
                          score: s,
                        }))}
                      >
                        <XAxis dataKey="turn" hide />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#111415",
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: "8px",
                            fontFamily: "JetBrains Mono",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke={team.color}
                          strokeWidth={3}
                          dot={{ fill: team.color, r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
