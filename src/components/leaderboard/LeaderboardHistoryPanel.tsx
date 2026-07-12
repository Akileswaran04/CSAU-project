import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, Clock, RefreshCw, HardDrive, AlertCircle } from "lucide-react";
import { useLeaderboardHistoryStore } from "../../store/useLeaderboardHistoryStore";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import { PanelShell } from "../shared/PanelShell";
import type { LocalMatch as LocalMatchType } from "../../lib/leaderboardHistoryService";

/* ─── All-Time Standings Table ─── */

function AllTimeStandings() {
  const { allTimeStandings, isLoading } = useLeaderboardHistoryStore();

  if (isLoading) {
    return (
      <div className="space-y-3 py-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 rounded-xl animate-pulse"
            style={{ background: "var(--color-glass-white-04)" }}
          />
        ))}
      </div>
    );
  }

  if (allTimeStandings.length === 0) {
    return (
      <div className="text-center py-8">
        <Medal size={28} className="mx-auto text-white/15 mb-2" />
        <p className="text-white/30 text-sm font-display">No history yet</p>
        <p className="text-white/20 text-xs mt-1">Complete a game to see all-time standings</p>
      </div>
    );
  }

  const top3Colors = [
    { bg: "rgba(255, 184, 48, 0.12)", border: "rgba(255, 184, 48, 0.3)", text: "#FFB830" },
    { bg: "rgba(160, 174, 192, 0.12)", border: "rgba(160, 174, 192, 0.3)", text: "#A0AEC0" },
    { bg: "rgba(205, 127, 50, 0.12)", border: "rgba(205, 127, 50, 0.3)", text: "#CD7F32" },
  ];

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {allTimeStandings.map((entry, index) => (
          <motion.div
            key={entry.teamName}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03, type: "spring", damping: 25, stiffness: 250 }}
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{
              background: index < 3 ? top3Colors[index].bg : "var(--color-glass-white-02)",
              border: `1px solid ${index < 3 ? top3Colors[index].border : "var(--color-glass-white-06)"}`,
            }}
          >
            {/* Rank badge */}
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={
                index < 3
                  ? { background: top3Colors[index].bg, border: `1px solid ${top3Colors[index].border}` }
                  : { background: "var(--color-glass-white-04)" }
              }
            >
              {index === 0 ? (
                <Trophy size={14} style={{ color: top3Colors[0].text }} />
              ) : (
                <span className="text-xs font-mono font-bold" style={{ color: index < 3 ? top3Colors[index].text : "var(--color-fg-subtle)" }}>
                  #{index + 1}
                </span>
              )}
            </div>

            {/* Team info */}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-display font-medium truncate">
                {entry.teamName}
              </p>
              <p className="text-white/30 text-xs font-mono">
                {entry.wins} win{entry.wins !== 1 ? "s" : ""} &middot; {entry.gamesPlayed} game{entry.gamesPlayed !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-white/30 text-[10px] uppercase tracking-wider font-mono">Correct</p>
                <p className="text-accent-success text-xs font-mono font-bold">
                  {entry.totalRiddlesAttempted > 0
                    ? Math.round((entry.totalRiddlesCorrect / entry.totalRiddlesAttempted) * 100)
                    : 0}%
                </p>
              </div>
              <div className="text-right">
                <p className={`${index < 3 ? "opacity-60" : "text-white/30"} text-[10px] uppercase tracking-wider font-mono`}
                  style={index < 3 ? { color: top3Colors[index].text } : undefined}>
                  Score
                </p>
                <p className="text-white font-mono font-bold text-lg">{entry.totalScore}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ─── Recent Match Card ─── */

function RecentMatchCard({ match, index }: { match: LocalMatchType; index: number }) {
  const date = new Date(match.createdAt);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className="rounded-xl p-3"
      style={{
        background: "var(--color-glass-white-02)",
        border: "1px solid var(--color-glass-white-06)",
      }}
    >
      {/* Header: winner + date */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Trophy size={12} style={{ color: "var(--color-accent-gold)" }} />
          <span className="text-white text-sm font-display font-medium truncate">
            {match.winnerName}
          </span>              <span className="text-fg-subtle text-xs shrink-0">won</span>
        </div>
        <span className="text-fg-faint text-[10px] font-mono shrink-0">{formattedDate}</span>
      </div>

      {/* Team list */}
      <div className="space-y-1">
        {match.teams
          .sort((a, b) => a.rank - b.rank)
          .map((team) => (
            <div key={team.teamName} className="flex items-center gap-2 text-xs">
              <span className="text-white/20 font-mono w-4 shrink-0">#{team.rank}</span>
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: team.teamColor }} />
              <span className="text-fg-muted truncate flex-1">{team.teamName}</span>
              <span className="text-fg-muted font-mono">{team.score} pts</span>
            </div>
          ))}
      </div>
    </motion.div>
  );
}

/* ─── Recent Matches List ─── */

function RecentMatches() {
  const { recentMatches, isLoading } = useLeaderboardHistoryStore();

  if (isLoading) {
    return (
      <div className="space-y-3 py-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 rounded-xl animate-pulse"
            style={{ background: "var(--color-glass-white-04)" }}
          />
        ))}
      </div>
    );
  }

  if (recentMatches.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock size={28} className="mx-auto text-white/15 mb-2" />
        <p className="text-white/30 text-sm font-display">No matches yet</p>
        <p className="text-white/20 text-xs mt-1">Completed games will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {recentMatches.map((match, index) => (
        <RecentMatchCard key={match.id} match={match} index={index} />
      ))}
    </div>
  );
}

/* ─── Storage Notice ─── */

function StorageNotice() {
  if (isSupabaseConfigured) return null;

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs mb-4"
      style={{
        background: "var(--color-glass-jade-08)",
        border: "1px solid var(--color-glass-jade-15)",
      }}
    >
      <HardDrive size={14} style={{ color: "var(--color-accent-primary)" }} />
      <span className="text-white/50 flex-1">
        Data stored locally in your browser
      </span>
    </div>
  );
}

/* ─── Error State ─── */

function ErrorState() {
  const { error, loadHistory } = useLeaderboardHistoryStore();

  if (!error) return null;

  return (
    <div className="text-center py-6">
      <AlertCircle size={24} className="mx-auto text-danger mb-2" />
      <p className="text-white/40 text-sm mb-3">{error}</p>
      <button
        onClick={loadHistory}
        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
        style={{
          color: "var(--color-accent-primary)",
          background: "var(--color-accent-primary-muted)",
        }}
      >
        <RefreshCw size={12} />
        Retry
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════════════════════════════════ */

export function LeaderboardHistoryPanel() {
  const { loadHistory, isLoading, error } = useLeaderboardHistoryStore();

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return (
    <div className="space-y-6">
      <StorageNotice />

      {error ? (
        <ErrorState />
      ) : (
        <>
          <PanelShell title="All-Time Standings">
            <AllTimeStandings />
          </PanelShell>

          <PanelShell
            title="Recent Matches"
            action={
              <button
                onClick={loadHistory}
                className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                style={{ color: "var(--color-fg-muted)" }}
                disabled={isLoading}
                aria-label="Refresh match history"
              >
                <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
                Refresh
              </button>
            }
          >
            <RecentMatches />
          </PanelShell>
        </>
      )}
    </div>
  );
}
