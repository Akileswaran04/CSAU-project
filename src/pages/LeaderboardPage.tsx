import { useState } from "react";
import { motion } from "framer-motion";
import { LeaderboardFullPage } from "../components/leaderboard/LeaderboardTable";
import { LeaderboardHistoryPanel } from "../components/leaderboard/LeaderboardHistoryPanel";
import { PanelShell } from "../components/shared/PanelShell";
import { useGameStore } from "../store/useGameStore";
import { Trophy, Clock } from "lucide-react";

function LoadingSkeleton() {
  return (
    <div className="max-w-4xl mx-auto relative z-10">
      <div className="mb-8">
        <div className="h-9 w-64 rounded-lg bg-white/[0.04] animate-pulse mb-2" />
        <div className="h-5 w-96 rounded-lg bg-white/[0.02] animate-pulse" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <PanelShell key={i} variant="tinted">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/[0.04] animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-32 rounded-lg bg-white/[0.04] animate-pulse" />
                <div className="h-4 w-48 rounded-lg bg-white/[0.02] animate-pulse" />
              </div>
              <div className="text-right space-y-1">
                <div className="h-7 w-16 rounded-lg bg-white/[0.04] animate-pulse" />
                <div className="h-3 w-8 rounded-lg bg-white/[0.02] animate-pulse ml-auto" />
              </div>
            </div>
          </PanelShell>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="max-w-4xl mx-auto relative z-10"
    >
      <div className="text-center py-20">
        <div
          className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
          style={{
            background: "var(--color-glass-jade-08)",
            border: "1px solid var(--color-glass-jade-12)",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-jade)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 6 8.5 6 9Z" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 18 8.5 18 9Z" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
          </svg>
        </div>
        <p className="text-white/40 text-lg font-display">No teams registered</p>
        <p className="text-white/25 text-sm mt-1">
          Start a game to see the leaderboard
        </p>
      </div>
    </motion.div>
  );
}

type Tab = "current" | "allTime";

export function LeaderboardPage() {
  const teams = useGameStore((s) => s.teams);
  const gamePhase = useGameStore((s) => s.gamePhase);
  const [activeTab, setActiveTab] = useState<Tab>("current");

  const tabs: { id: Tab; label: string; icon: typeof Trophy }[] = [
    { id: "current", label: "This Game", icon: Trophy },
    { id: "allTime", label: "All-Time", icon: Clock },
  ];

  // Show loading skeleton while store is hydrating
  if (teams.length === 0 && gamePhase === "idle") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen p-6"
        style={{ background: "var(--color-bg-base)" }}
      >
        <LoadingSkeleton />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="min-h-screen p-6"
      style={{ background: "var(--color-bg-base)" }}
    >
      {/* Tab toggle */}
      <div className="max-w-4xl mx-auto relative z-10 mb-6">
        <div
          className="inline-flex rounded-xl p-1"
          style={{
            background: "var(--color-glass-white-04)",
            border: "1px solid var(--color-glass-white-06)",
          }}
        >
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-display font-medium transition-all duration-200 ${
                activeTab === id ? "text-white" : "text-white/40 hover:text-white/70"
              }`}
            >
              {activeTab === id && (
                <motion.div
                  layoutId="leaderboard-tab-bg"
                  className="absolute inset-0 rounded-lg"
                  style={{
                    background: "var(--color-glass-white-08)",
                    border: "1px solid var(--color-glass-white-10)",
                  }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                />
              )}
              <Icon size={16} className="relative z-10" aria-hidden="true" />
              <span className="relative z-10">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {activeTab === "current" ? (
          teams.length === 0 ? <EmptyState /> : <LeaderboardFullPage />
        ) : (
          <div className="max-w-4xl mx-auto relative z-10">
            <LeaderboardHistoryPanel />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
