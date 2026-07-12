import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameBoard3D } from "../components/board/GameBoard3D";
import { DicePanel } from "../components/dice/DicePanel";
import { RiddleModal } from "../components/riddles/RiddleModal";
import { LeaderboardTable } from "../components/leaderboard/LeaderboardTable";
import { GameControlBar } from "../components/controls/GameControlBar";
import { ActionLog } from "../components/controls/ActionLog";
import { useGameStore } from "../store/useGameStore";
import { useRoomStore } from "../store/useRoomStore";
import { useDiceRoll } from "../hooks/useDiceRoll";
import { useForcedRiddle } from "../hooks/useForcedRiddle";
import { useRiddleStore } from "../store/useRiddleStore";
import { soundManager } from "../lib/sound";
import { useSettingsStore } from "../store/useSettingsStore";
import { boardCells } from "../data/boardConfig";
import { saveMatchResult } from "../lib/leaderboardHistoryService";
import { useLeaderboardHistoryStore } from "../store/useLeaderboardHistoryStore";
import { Trophy, Crown, Medal, Award, Download, RotateCcw, Share2, Minimize2, ChevronUp, PanelRightClose, PanelRightOpen, Eye, Wifi, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "../components/ui/button";
import { useRealtimeRoom, getSavedRoom } from "../hooks/useRealtimeRoom";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

/* ─── Reconnecting overlay ─── */
function ReconnectingOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-900/90 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 200 }}
        className="text-center"
      >
        <div
          className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6"
          style={{
            background: "var(--color-accent-primary-muted)",
            border: "1px solid var(--color-accent-primary-muted)",
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          >
            <Wifi size={36} style={{ color: "var(--color-accent-primary)" }} />
          </motion.div>
        </div>
        <motion.h2
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-2xl font-display font-bold text-white mb-2"
        >
          Reconnecting
        </motion.h2>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-fg-muted font-display"
        >
          Restoring your game session...
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex justify-center gap-1"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ background: "var(--color-accent-primary)" }}
              animate={{ y: [0, -8, 0] }}
              transition={{
                repeat: Infinity,
                duration: 0.6,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Victory Screen ─── */
function VictoryScreen() {
  const { teams, winner, setGamePhase, setWinner } = useGameStore();
  const gameMode = useGameStore((s) => s.gameMode);
  const room = useRealtimeRoom();
  const navigate = useNavigate();

  const sortedTeams = [...teams].sort((a, b) => {
    if (b.position !== a.position) return b.position - a.position;
    return b.score - a.score;
  });

  const handleExport = () => {
    const data = sortedTeams.map((t, i) => ({
      rank: i + 1,
      name: t.name,
      participants: t.participants.map((p) => p.name).join(" & "),
      score: t.score,
      position: t.position + 1,
      riddlesAttempted: t.riddlesAttempted,
      riddlesCorrect: t.riddlesCorrect,
      riddlesIncorrect: t.riddlesIncorrect,
    }));
    const csv = [["Rank", "Team", "Participants", "Score", "Position", "Riddles", "Correct", "Incorrect"],
      ...data.map((d) => [d.rank, d.name, d.participants, d.score, d.position, d.riddlesAttempted, d.riddlesCorrect, d.riddlesIncorrect]),
    ].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const exportUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = exportUrl;
    a.download = `riddle-rush-results-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(exportUrl);
    toast.success("Results exported as CSV");
  };

  const handleShare = async () => {
    const lines = ["Riddle Rush — Final Results", ""];
    sortedTeams.forEach((t, i) => {
      const badge = i === 0 ? "[1st]" : i === 1 ? "[2nd]" : i === 2 ? "[3rd]" : `[#${i + 1}]`;
      const rate = t.riddlesAttempted > 0 ? `${Math.round((t.riddlesCorrect / t.riddlesAttempted) * 100)}% correct` : "no riddles";
      lines.push(`${badge}  ${t.name} — ${t.score} pts, cell ${t.position + 1}, ${rate}`);
    });
    lines.push("", "Play at riddle-rush.app");
    const text = lines.join("\n");
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: "Riddle Rush Results", text }); return; }
      catch (err) { if ((err as Error).name === "AbortError") return; }
    }
    try { await navigator.clipboard.writeText(text); toast.success("Results copied to clipboard!"); }
    catch { toast.error("Could not share results"); }
  };

  const handlePlayAgain = () => {
    if (gameMode === "online" && !room.isHost) return;
    for (const team of teams) {
      useGameStore.getState().updateTeam(team.id, {
        position: 0, score: 0, riddlesAttempted: 0, riddlesCorrect: 0, riddlesIncorrect: 0,
        consecutiveNonRiddleTurns: 0, totalTurns: 0, scoreHistory: [0],
      });
    }
    setWinner(null);
    useGameStore.getState().setCurrentTeamIndex(0);
    const firstTeam = teams[0];
    if (firstTeam) useGameStore.getState().setActiveTeamId(firstTeam.id);
    useGameStore.getState().setResultsSaved(false);
    setGamePhase("active");
    // Broadcast will fire via Zustand subscription in useRealtimeRoom
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-mesh-animated">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 200, delay: 0.2 }}
        className="glass-panel-tinted max-w-2xl w-full p-8 text-center">
        {gameMode === "online" && room.isHost && (
          <div className="flex justify-end mb-2">
            <button onClick={async () => { await room.endRoom(); navigate("/setup"); }}
              className="text-xs font-mono px-3 py-1 rounded-full"
              style={{ color: "var(--color-fg-muted)", border: "1px solid var(--color-glass-border)" }}>
              End Room
            </button>
          </div>
        )}
        {gameMode === "online" && !room.isHost && (
          <div className="flex justify-end mb-2">
            <button onClick={() => navigate("/setup")}
              className="text-xs font-mono px-3 py-1 rounded-full"
              style={{ color: "var(--color-fg-muted)", border: "1px solid var(--color-glass-border)" }}>
              <ArrowLeft size={14} className="inline mr-1" />
              Leave
            </button>
          </div>
        )}
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 300, delay: 0.4 }}
          className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6"
          style={{ background: "var(--color-accent-gold-muted)", border: "1px solid rgba(255, 184, 48, 0.3)", boxShadow: "0 0 60px rgba(255, 184, 48, 0.2)" }}>
          <Trophy size={40} className="text-accent-gold" />
        </motion.div>
        <h2 className="text-3xl font-display font-bold text-white mb-2 flex items-center justify-center gap-3">
          <Trophy size={28} className="text-accent-gold" /> Game Over!
        </h2>
        {winner && <p className="text-accent-gold text-lg font-display font-medium mb-6">{winner.name} wins with {winner.score} points!</p>}
        <div className="space-y-3 mb-8">
          {sortedTeams.map((team, i) => (
            <motion.div key={team.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className={`glass-panel flex items-center gap-4 p-4 ${i === 0 ? "glass-panel-tinted" : ""}`}
              style={i === 0 ? { borderColor: "rgba(255, 184, 48, 0.2)" } : undefined}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-sm"
                style={{ backgroundColor: team.color + "20", border: `1px solid ${team.color}40`, color: team.color }}>
                {i === 0 ? <Crown size={20} /> : i === 1 ? <Medal size={20} /> : i === 2 ? <Award size={20} /> : `#${i + 1}`}
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-display font-semibold">{team.name}</p>
                <p className="text-fg-muted text-xs font-mono">{team.riddlesCorrect}/{team.riddlesAttempted} riddles correct</p>
              </div>
              <div className="text-right">
                <p className="text-white font-mono font-bold text-xl">{team.score}</p>
                <p className="text-fg-subtle text-xs font-mono">pts</p>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button onClick={handleShare} variant="secondary"><Share2 size={18} /> Share</Button>
          <Button onClick={handleExport} variant="secondary"><Download size={18} /> Export CSV</Button>
          {(gameMode !== "online" || room.isHost) && (
            <Button onClick={handlePlayAgain} variant="primary" size="lg">
              <RotateCcw size={18} /> Play Again
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Network disconnected banner ─── */
function DisconnectedBanner() {
  const room = useRoomStore();
  const gameMode = useGameStore((s) => s.gameMode);
  const hookRoom = useRealtimeRoom();
  const [isRetrying, setIsRetrying] = useState(false);

  if (!room.connectionDropped || gameMode !== "online") return null;

  const handleReconnect = async () => {
    setIsRetrying(true);
    const ok = await hookRoom.reconnect();
    setIsRetrying(false);
    if (ok) {
      toast.success("Reconnected successfully");
    } else {
      // Read fresh error from store (not stale closure)
      toast.error(useRoomStore.getState().error || "Could not reconnect");
    }
  };

  return (
    <motion.div
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -60, opacity: 0 }}
      className="fixed top-0 left-0 right-0 z-[70]"
    >
      <div
        className="flex items-center justify-center gap-3 px-4 py-3 text-sm font-display"
        style={{
          background: "linear-gradient(135deg, rgba(225, 29, 60, 0.15), rgba(225, 29, 60, 0.08))",
          borderBottom: "1px solid rgba(225, 29, 60, 0.2)",
          color: "#FF6B6B",
        }}
      >
        <motion.div
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="w-2 h-2 rounded-full bg-danger shrink-0"
        />
        <span className="font-medium">Network connection lost</span>
        <span className="text-white/40 text-xs hidden sm:inline">
          Trying to reconnect...
        </span>
        <button
          onClick={handleReconnect}
          disabled={isRetrying}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ml-2"
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            color: "#FF6B6B",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)"}
        >
          <RefreshCw size={14} className={isRetrying ? "animate-spin" : ""} />
          Reconnect Now
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Spectator indicator banner ─── */
function SpectatorBanner() {
  const room = useRoomStore();
  if (!room.isConnected || room.isHost) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md"
      style={{ background: "rgba(159, 76, 47, 0.15)", border: "1px solid rgba(159, 76, 47, 0.3)" }}>
      <Eye size={14} style={{ color: "#9F4C2F" }} />
      <span className="text-xs font-display font-medium" style={{ color: "#9F4C2F" }}>
        Spectating
      </span>
      <Wifi size={12} style={{ color: "rgba(159, 76, 47, 0.5)" }} />
    </div>
  );
}

export function BoardPage() {
  const { teams, gamePhase, currentTeamIndex, isRolling, setIsRiddleOpen, advanceTurn, winner } = useGameStore();
  const { drawRiddle } = useRiddleStore();
  const isForcedRiddle = useRiddleStore((s) => s.isForcedRiddle);
  const forcedCurrentRiddle = useRiddleStore((s) => s.currentRiddle);
  const { roll, isAnimating } = useDiceRoll();
  const { checkAndTriggerForcedRiddle } = useForcedRiddle();
  const sfxVolume = useSettingsStore((s) => s.sfxVolume);
  const musicVolume = useSettingsStore((s) => s.musicVolume);
  const rollInProgress = useRef(false);
  const [showSidePanel, setShowSidePanel] = useState(false);

  // Keep broadcast subscription alive for non-host players
  const hookRoom = useRealtimeRoom();

  const gameMode = useGameStore((s) => s.gameMode);
  const room = useRoomStore();
  const isOnlineNonHost = gameMode === "online" && room.isConnected && !room.isHost;
  const navigate = useNavigate();

  /* ─── Auto-reconnect on mount if we have a saved room ─── */
  const [isReconnecting, setIsReconnecting] = useState(false);
  const reconnectAttempted = useRef(false);

  useEffect(() => {
    if (reconnectAttempted.current) return;
    const saved = getSavedRoom();
    if (!saved) return;
    if (room.isConnected && room.roomCode) return; // already connected

    // Check if we're in an online context with no active connection
    if (gameMode === "online" || saved) {
      reconnectAttempted.current = true;
      setIsReconnecting(true);

      hookRoom.reconnect().then((ok) => {
        setIsReconnecting(false);
        if (!ok) {
          // Reconnect failed — show a dismissable error
          const errMsg = room.error || "Could not reconnect";
          toast.error(`${errMsg} — redirecting to setup`);
          setTimeout(() => navigate("/setup"), 2000);
        }
      });
    }
  }, []); // only on mount

  const currentTeam = teams[currentTeamIndex];

  const handleRoll = useCallback(async () => {
    if (isOnlineNonHost) return;
    if (rollInProgress.current || gamePhase !== "active" || !currentTeam || isRolling || isAnimating) return;

    rollInProgress.current = true;
    const result = await roll();

    if (result) {
      const landingCell = boardCells[Math.min(result.newPosition, 31)];
      const isForced = checkAndTriggerForcedRiddle();

      if (!isForced && landingCell?.type === "riddle" && landingCell.difficulty) {
        setTimeout(() => { drawRiddle(landingCell.difficulty!, Math.random() < 0.5 ? "tech" : "non-tech"); setIsRiddleOpen(true); }, 500);
      } else if (isForced) {
        setTimeout(() => { setIsRiddleOpen(true); }, 500);
      } else {
        setTimeout(() => { advanceTurn(); }, 1000);
      }
    }
    rollInProgress.current = false;
  }, [roll, gamePhase, currentTeam, isRolling, isAnimating, checkAndTriggerForcedRiddle, drawRiddle, setIsRiddleOpen, advanceTurn, isOnlineNonHost]);

  useEffect(() => {
    if (isForcedRiddle && forcedCurrentRiddle) setIsRiddleOpen(true);
  }, [isForcedRiddle, forcedCurrentRiddle, setIsRiddleOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOnlineNonHost) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "r" || e.key === "R") {
        if (gamePhase === "active" && !useGameStore.getState().isRolling && !useGameStore.getState().isRiddleOpen) handleRoll();
      }
      if (e.key === " ") {
        e.preventDefault();
        const state = useGameStore.getState();
        if (state.gamePhase === "active") state.setGamePhase("paused");
        else if (state.gamePhase === "paused") state.setGamePhase("active");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gamePhase, handleRoll, isOnlineNonHost]);

  useEffect(() => { soundManager.sfxVolume = sfxVolume / 100; }, [sfxVolume]);
  useEffect(() => { soundManager.musicVolume = musicVolume / 100; }, [musicVolume]);

  useEffect(() => {
    if (gamePhase === "active" && teams.length > 0) soundManager.startMusic();
    if (gamePhase === "ended") { soundManager.stopMusic(); confetti({ particleCount: 300, spread: 180, origin: { y: 0.3 } }); }
  }, [gamePhase, teams.length]);

  const resultsSaved = useGameStore((s) => s.resultsSaved);
  useEffect(() => {
    if (gamePhase === "ended" && teams.length > 0 && !resultsSaved) {
      saveMatchResult(teams, gameMode).then(() => {
        useGameStore.getState().setResultsSaved(true);
        useLeaderboardHistoryStore.getState().loadHistory();
      });
    }
  }, [gamePhase, teams, resultsSaved, gameMode]);

  const [boardFullscreen, setBoardFullscreen] = useState(() => {
    try { return localStorage.getItem("riddle-rush-board-fullscreen") === "true"; }
    catch { return false; }
  });
  const isDisabled = isRolling || gamePhase !== "active" || teams.length === 0 || isOnlineNonHost;

  const toggleFullscreen = useCallback(() => setBoardFullscreen((prev) => !prev), []);

  useEffect(() => {
    try { localStorage.setItem("riddle-rush-board-fullscreen", String(boardFullscreen)); }
    catch { }
  }, [boardFullscreen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "f" || e.key === "F") setBoardFullscreen((prev) => !prev);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // ─── Show reconnecting overlay ───
  if (isReconnecting) {
    return <ReconnectingOverlay />;
  }

  return (
    <>
      {/* Disconnected banner — fixed, renders above everything */}
      <AnimatePresence>
        {room.connectionDropped && gameMode === "online" && (
          <DisconnectedBanner />
        )}
      </AnimatePresence>

      {boardFullscreen ? (
        <motion.div initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }} className="fixed inset-0 z-50 bg-ink-900">
          <SpectatorBanner />
        <AnimatePresence>{gamePhase === "ended" && winner && <VictoryScreen />}</AnimatePresence>
        <div className="absolute inset-0"><GameBoard3D onToggleFullscreen={toggleFullscreen} isFullscreen={true} /></div>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }} className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
          <DicePanel onRoll={handleRoll} isDisabled={isDisabled} variant="floating" />
        </motion.div>
        <motion.button initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.15 }} onClick={toggleFullscreen}
          className="absolute top-4 left-4 z-30 glass-button p-2.5 text-white/50 hover:text-white"
          aria-label="Exit fullscreen"><Minimize2 size={18} /></motion.button>
        <RiddleModal />
      </motion.div>
    ) : (
      <div className="min-h-full flex flex-col"
      style={{ background: ["radial-gradient(ellipse at 30% 20%, rgba(47, 217, 168, 0.06) 0%, transparent 60%)", "radial-gradient(ellipse at 70% 80%, rgba(255, 184, 48, 0.03) 0%, transparent 50%)", "var(--color-bg-base)"].join(", ") }}>
      <SpectatorBanner />
      <AnimatePresence>{gamePhase === "ended" && winner && <VictoryScreen />}</AnimatePresence>
      <div className="sticky top-0 z-40 backdrop-blur-lg border-b border-white/[0.04] flex-shrink-0"
        style={{ background: "var(--color-bg-header)" }}>
        <div className="p-3 px-5 flex items-center gap-3">
          <div className="flex-1"><GameControlBar /></div>
          {/* Room code badge for online host */}
          {gameMode === "online" && room.isConnected && room.roomCode && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full shrink-0"
              style={{
                background: "var(--color-accent-primary-muted)",
                border: "1px solid var(--color-accent-primary-muted)",
              }}
            >
              <Wifi size={12} style={{ color: "var(--color-accent-primary)" }} />
              <span
                className="text-[10px] font-mono font-bold tracking-wider"
                style={{ color: "var(--color-accent-primary)" }}
              >
                {room.roomCode}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 relative min-h-0">
        <div className="absolute inset-0">
          <div className="h-full rounded-2xl overflow-hidden glass-panel p-1 m-6">
            <div className="w-full h-full min-h-[400px] rounded-xl overflow-hidden"><GameBoard3D onToggleFullscreen={toggleFullscreen} /></div>
          </div>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 hidden lg:block">
          <DicePanel onRoll={handleRoll} isDisabled={isDisabled} variant="floating" />
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 lg:hidden">
          <DicePanel onRoll={handleRoll} isDisabled={isDisabled} variant="compact" />
        </div>
        <button onClick={() => setShowSidePanel(!showSidePanel)}
          className={`absolute top-4 left-1/2 -translate-x-1/2 z-30 glass-button px-3 py-2 flex items-center gap-2 transition-all ${showSidePanel ? "text-jade border-jade/30" : "text-white/50 hover:text-white"}`}
          aria-label={showSidePanel ? "Close stats panel" : "Open stats panel"}>
          {showSidePanel ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          <span className="text-xs font-display font-medium hidden sm:inline">{showSidePanel ? "Hide Stats" : "Show Stats"}</span>
        </button>
        <AnimatePresence>
          {showSidePanel && (
            <motion.div initial={{ x: 380, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 380, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute top-6 right-6 z-20 w-[380px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-8rem)] overflow-y-auto hidden lg:block"
              style={{ paddingTop: "3rem" }}>
              <div className="flex flex-col gap-6 pr-1"><LeaderboardTable /><ActionLog /></div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showSidePanel && (
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }} className="fixed inset-x-0 bottom-0 z-30 lg:hidden"
              style={{ maxHeight: "60vh" }}>
              <div className="relative rounded-t-2xl overflow-hidden"
                style={{ background: "var(--color-bg-elevated)", borderTop: "1px solid var(--color-glass-border)" }}>
                <button onClick={() => setShowSidePanel(false)} className="w-full flex justify-center pt-3 pb-2 text-white/30 hover:text-white/50">
                  <ChevronUp size={20} />
                </button>
                <div className="px-4 pb-6 max-h-[55vh] overflow-y-auto space-y-4"><LeaderboardTable /><ActionLog /></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <RiddleModal />
    </div>
    )}
    </>
  );
}
