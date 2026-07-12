import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit3,
  Trash2,
  Lock,
  Users,
  Wifi,
  WifiOff,
  DoorOpen,
  UserPlus,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { useGameStore, TEAM_ICONS, type TeamIcon, type GameMode } from "../store/useGameStore";
import { TeamIconDisplay } from "../components/shared/TeamIconDisplay";
import { PanelShell } from "../components/shared/PanelShell";
import { Modal } from "../components/shared/Modal";
import { ConfirmDialog } from "../components/shared/ConfirmDialog";
import { Badge } from "../components/shared/Badge";
import { Button } from "../components/ui/button";
import { WaitingRoom } from "../components/shared/WaitingRoom";
import { useRealtimeRoom } from "../hooks/useRealtimeRoom";
import { toast } from "sonner";

const teamSchema = z.object({
  name: z.string().min(1, "Team name is required").max(30, "Team name too long"),
  participant1: z.string().min(1, "Participant 1 is required").max(50),
  participant2: z.string().min(1, "Participant 2 is required").max(50),
});

type TeamFormData = z.infer<typeof teamSchema>;

const TEAM_COLORS = [
  { value: "#FF7A45", label: "Copper" },
  { value: "#C6F135", label: "Lime" },
  { value: "#FFB830", label: "Gold" },
  { value: "#E11D3C", label: "Crimson" },
  { value: "#A0AEC0", label: "Silver" },
  { value: "#CD7F32", label: "Bronze" },
  { value: "#06B6D4", label: "Cyan" },
  { value: "#14B8A6", label: "Teal" },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Offline Team Management Panel
   ═══════════════════════════════════════════════════════════════════════════ */
function OfflineTeamPanel() {
  const { teams, gamePhase, addTeam, updateTeam, removeTeam } = useGameStore();
  const isLocked = gamePhase !== "idle";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState(TEAM_COLORS[0].value);
  const [selectedIcon, setSelectedIcon] = useState<TeamIcon>("sword");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
  });

  const openAddModal = () => {
    if (isLocked) return;
    setEditingTeam(null);
    setSelectedColor(TEAM_COLORS[0].value);
    setSelectedIcon("sword");
    reset({ name: "", participant1: "", participant2: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (teamId: string) => {
    if (isLocked) return;
    const team = teams.find((t) => t.id === teamId);
    if (!team) return;
    setEditingTeam(teamId);
    setSelectedColor(team.color);
    setSelectedIcon(team.icon);
    setValue("name", team.name);
    setValue("participant1", team.participants[0]?.name || "");
    setValue("participant2", team.participants[1]?.name || "");
    setIsModalOpen(true);
  };

  const onSubmit = (data: TeamFormData) => {
    const nameExists = teams.some(
      (t) => t.name.toLowerCase() === data.name.toLowerCase() && t.id !== editingTeam
    );
    if (nameExists) {
      toast.error("Team name already exists");
      return;
    }
    if (editingTeam) {
      updateTeam(editingTeam, {
        name: data.name,
        participants: [{ name: data.participant1 }, { name: data.participant2 }],
        color: selectedColor,
        icon: selectedIcon,
      });
      toast.success(`Team "${data.name}" updated`);
    } else {
      addTeam({
        name: data.name,
        participants: [{ name: data.participant1 }, { name: data.participant2 }],
        color: selectedColor,
        icon: selectedIcon,
      });
      toast.success(`Team "${data.name}" registered`);
    }
    setIsModalOpen(false);
    reset();
  };

  const handleDelete = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId);
    removeTeam(teamId);
    toast.success(`Team "${team?.name}" removed`);
    setDeleteConfirm(null);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Team Registration</h1>
          <p className="text-white/40 mt-1">Register teams for the Riddle Rush challenge</p>
        </div>
        <Button onClick={openAddModal} disabled={isLocked} variant="primary" size="lg">
          {isLocked ? <Lock size={18} /> : <Plus size={18} />}
          Add Team
        </Button>
      </div>

      {isLocked && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 glass-panel p-4 flex items-center gap-3"
          style={{ borderColor: "rgba(255, 184, 48, 0.2)", background: "rgba(255, 184, 48, 0.05)" }}
        >
          <Lock size={18} className="text-accent-gold shrink-0" />
          <p className="text-accent-gold text-sm font-medium">Registration is locked — the game has already started.</p>
        </motion.div>
      )}

      {teams.length === 0 ? (
        <div className="text-center py-20">
          <div
            className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "var(--color-glass-jade-08)", border: "1px solid var(--color-glass-jade-12)" }}
          >
            <Users size={28} className="text-jade/40" />
          </div>
          <p className="text-fg-muted text-lg font-display">No teams registered yet</p>
          <p className="text-fg-subtle text-sm mt-1">Add teams to start the game</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {teams.map((team, index) => (
              <motion.div
                key={team.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
              >
                <PanelShell variant="tinted">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: team.color + "20",
                        border: `1px solid ${team.color}40`,
                        color: team.color,
                      }}
                    >
                      <TeamIconDisplay icon={team.icon} size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-display font-semibold text-white truncate">{team.name}</h3>
                        <Badge variant="default" size="sm">#{index + 1}</Badge>
                      </div>
                      <div className="mt-2 space-y-1">
                        <p className="text-fg-muted text-sm flex items-center gap-2">
                          <Users size={14} className="text-white/30" />
                          {team.participants.map((p) => p.name).join(" & ")}
                        </p>
                      </div>
                    </div>
                    {!isLocked && (
                      <div className="flex gap-2 shrink-0">
                        <Button onClick={() => openEditModal(team.id)} variant="ghost" size="sm" className="text-fg-subtle hover:text-white">
                          <Edit3 size={16} />
                        </Button>
                        <Button onClick={() => setDeleteConfirm(team.id)} variant="ghost" size="sm" className="text-fg-subtle hover:text-danger">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    )}
                  </div>
                </PanelShell>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTeam ? "Edit Team" : "Add Team"} size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-display font-medium text-fg-muted mb-1.5">Team Name</label>
            <input {...register("name")} placeholder="Enter team name" className="glass-input w-full" />
            {errors.name && <p className="text-danger text-sm mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-display font-medium text-fg-muted mb-1.5">Participant 1</label>
            <input {...register("participant1")} placeholder="Name" className="glass-input w-full" />
            {errors.participant1 && <p className="text-danger text-sm mt-1">{errors.participant1.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-display font-medium text-fg-muted mb-1.5">Participant 2</label>
            <input {...register("participant2")} placeholder="Name" className="glass-input w-full" />
            {errors.participant2 && <p className="text-danger text-sm mt-1">{errors.participant2.message}</p>}
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" onClick={() => setIsModalOpen(false)} variant="secondary">Cancel</Button>
            <Button type="submit" variant="primary">{editingTeam ? "Save Changes" : "Add Team"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Remove Team" message="Are you sure you want to remove this team?" confirmLabel="Remove" variant="danger" />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Online Lobby — Create or Join a room (receives room hook via props)
   ═══════════════════════════════════════════════════════════════════════════ */
interface OnlineLobbyProps {
  onCreateRoom: (name: string) => Promise<string | null>;
  onJoinRoom: (code: string, name: string) => Promise<boolean>;
  error: string | null;
}

function OnlineLobby({ onCreateRoom, onJoinRoom, error }: OnlineLobbyProps) {
  const [playerName, setPlayerName] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const handleCreate = async () => {
    if (!playerName.trim()) { toast.error("Enter a player name first"); return; }
    setCreating(true);
    await onCreateRoom(playerName.trim());
    setCreating(false);
  };

  const handleJoin = async () => {
    if (!playerName.trim()) { toast.error("Enter a player name first"); return; }
    if (!roomCodeInput.trim()) { toast.error("Enter a room code"); return; }
    setJoining(true);
    await onJoinRoom(roomCodeInput.trim().toUpperCase(), playerName.trim());
    setJoining(false);
  };

  return (
    <div className="min-h-[500px] flex flex-col items-center justify-center px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "var(--color-accent-primary-muted)", border: "1px solid var(--color-accent-primary-muted)" }}>
            <Wifi size={32} style={{ color: "var(--color-accent-primary)" }} />
          </div>
          <h2 className="text-2xl font-display font-bold mb-1" style={{ color: "var(--color-fg-default)" }}>Online Multiplayer</h2>
          <p className="text-sm" style={{ color: "var(--color-fg-muted)" }}>Play with friends in real-time</p>
        </div>

        <div className="p-4 rounded-xl mb-6" style={{ background: "var(--color-glass-bg)", border: "1px solid var(--color-glass-border)" }}>
          <label className="block text-xs font-display font-medium mb-1.5" style={{ color: "var(--color-fg-muted)" }}>Your Player Name</label>
          <input value={playerName} onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your display name" className="glass-input w-full" maxLength={24} />
        </div>

        <Button onClick={handleCreate} variant="primary" size="lg" className="w-full mb-4" disabled={!playerName.trim() || creating}>
          {creating ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
          {creating ? "Creating Room..." : "Create Room"}
        </Button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ background: "var(--color-glass-border)" }} />
          <span className="text-xs" style={{ color: "var(--color-fg-faint)" }}>OR</span>
          <div className="flex-1 h-px" style={{ background: "var(--color-glass-border)" }} />
        </div>

        <div className="p-4 rounded-xl mb-4" style={{ background: "var(--color-glass-bg)", border: "1px solid var(--color-glass-border)" }}>
          <label className="block text-xs font-display font-medium mb-1.5" style={{ color: "var(--color-fg-muted)" }}>Room Code</label>
          <input value={roomCodeInput} onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="e.g. ABC123" className="glass-input w-full text-center text-lg font-mono font-bold tracking-[0.15em] uppercase mb-3" maxLength={6} />
          <Button onClick={handleJoin} variant="secondary" size="lg" className="w-full" disabled={!playerName.trim() || !roomCodeInput.trim() || joining}>
            {joining ? <Loader2 size={18} className="animate-spin" /> : <DoorOpen size={18} />}
            {joining ? "Joining..." : "Join Room"}
          </Button>
        </div>

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-sm text-center" style={{ color: "var(--color-accent-danger)" }}>
            {error}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Reconnect Banner — shown when a saved room is found in localStorage
   ═══════════════════════════════════════════════════════════════════════════ */
function ReconnectBanner({
  savedRoom,
  onReconnect,
  onDismiss,
}: {
  savedRoom: { code: string; playerName: string; isHost: boolean };
  onReconnect: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="min-h-[500px] flex flex-col items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 250 }}
        className="w-full max-w-md"
      >
        <div
          className="p-8 rounded-2xl text-center"
          style={{
            background: "var(--color-glass-blue-06)",
            border: "1px solid var(--color-glass-blue-10)",
          }}
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.1 }}
            className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-5"
            style={{
              background: "var(--color-accent-primary-muted)",
              border: "1px solid var(--color-accent-primary-muted)",
            }}
          >
            <Wifi size={32} style={{ color: "var(--color-accent-primary)" }} />
          </motion.div>

          <h2 className="text-2xl font-display font-bold mb-1" style={{ color: "var(--color-fg-default)" }}>
            Reconnect to Room
          </h2>
          <p className="text-sm mb-2" style={{ color: "var(--color-fg-muted)" }}>
            You were previously in a room as{' '}
            <span className="font-semibold" style={{ color: "var(--color-fg-default)" }}>
              {savedRoom.playerName}
            </span>
          </p>

          {/* Room code badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{
              background: "var(--color-glass-blue-08)",
              border: "1px solid var(--color-glass-blue-15)",
              color: "var(--color-accent-primary)",
            }}
          >
            <Wifi size={14} />
            <span className="text-sm font-mono font-bold tracking-[0.15em]">
              {savedRoom.code}
            </span>
          </div>

          <div className="space-y-3">
            <Button
              onClick={onReconnect}
              variant="primary"
              size="lg"
              className="w-full"
            >
              <RefreshCw size={18} />
              Reconnect
            </Button>

            <Button
              onClick={onDismiss}
              variant="ghost"
              size="sm"
              className="w-full !text-white/40 hover:!text-white/70"
            >
              <X size={16} />
              Start Fresh
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN: SetupPage
   ═══════════════════════════════════════════════════════════════════════════ */
export function SetupPage() {
  const { gamePhase, gameMode, setGameMode, teams, addTeam, removeTeam } = useGameStore();
  const isLocked = gamePhase !== "idle";
  const navigate = useNavigate();
  const room = useRealtimeRoom();

  // Reconnect banner dismiss
  const [dismissedReconnect, setDismissed] = useState(false);

  // Team management for host (online mode)
  const [teamName, setTeamName] = useState("");

  // ─── Auto-navigate non-host players to board when game starts ───
  useEffect(() => {
    if (gameMode === "online" && !room.isHost && room.isGameActive && gamePhase === "active") {
      navigate("/board");
    }
  }, [gameMode, room.isHost, room.isGameActive, gamePhase, navigate]);

  // ─── Host: start game → initialize state + navigate ───
  const handleStartGame = () => {
    if (!room.isHost) return;
    if (teams.length < 2) {
      toast.error("Add at least 2 teams to start");
      return;
    }
    room.initializeGame();
    navigate("/board");
  };

  const handleLeaveRoom = async () => {
    await room.leaveRoom();
    setGameMode("offline");
  };

  const handleCreateRoom = async (name: string) => {
    const code = await room.createRoom(name);
    return code;
  };

  const handleJoinRoom = async (code: string, name: string) => {
    const ok = await room.joinRoom(code, name);
    return ok;
  };

  // ─── Host team management ───
  const addHostTeam = () => {
    if (!teamName.trim()) {
      toast.error("Enter a team name");
      return;
    }
    const colorIndex = teams.length % TEAM_COLORS.length;
    const iconIndex = teams.length % TEAM_ICONS.length;
    addTeam({
      name: teamName.trim(),
      participants: [{ name: room.players.find(p => p.isHost)?.playerName || "Host" }, { name: "Player 2" }],
      color: TEAM_COLORS[colorIndex].value,
      icon: TEAM_ICONS[iconIndex],
    });
    setTeamName("");
    toast.success(`Team "${teamName.trim()}" added`);
  };

  const modeOptions: { id: GameMode; label: string; icon: typeof WifiOff; description: string }[] = [
    { id: "offline", label: "Local Game", icon: WifiOff, description: "Hot-seat multiplayer on this device" },
    { id: "online", label: "Online", icon: Wifi, description: "Play across devices in real-time" },
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Game Mode Toggle */}
        <div className="mb-8">
          <div className="inline-flex rounded-xl p-1"
            style={{ background: "var(--color-glass-white-04)", border: "1px solid var(--color-glass-white-06)" }}>
            {modeOptions.map(({ id, label, icon: Icon, description }) => (
              <button key={id}
                onClick={() => {
                  if (isLocked) return;
                  setGameMode(id);
                  if (id === "offline") room.leaveRoom();
                }}
                disabled={isLocked}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-display font-medium transition-all duration-200 ${
                  gameMode === id ? "text-white" : "text-white/40 hover:text-white/70"
                } ${isLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                title={description}>
                {gameMode === id && (
                  <motion.div layoutId="game-mode-bg" className="absolute inset-0 rounded-lg"
                    style={{ background: "var(--color-glass-blue-10)", border: "1px solid var(--color-glass-blue-20)" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }} />
                )}
                <Icon size={16} className="relative z-10" />
                <span className="relative z-10">{label}</span>
              </button>
            ))}
          </div>
          <p className="text-white/30 text-xs mt-2 font-display">
            {gameMode === "offline" ? "Add 2+ teams and play on this device" : "Create or join a room to play online"}
          </p>
        </div>

        {/* Mode-specific content */}
        {gameMode === "offline" ? (
          <OfflineTeamPanel />
        ) : !room.roomCode && room.savedRoom && !dismissedReconnect ? (
          <ReconnectBanner
            savedRoom={room.savedRoom}
            onReconnect={async () => {
              const ok = await room.reconnect();
              if (ok) {
                // Read fresh state from store (not stale closure value)
                const { teams, gamePhase } = useGameStore.getState();
                if (teams.length > 0) {
                  toast.success(`Restored ${teams.length} team${teams.length !== 1 ? "s" : ""}`);
                }
                if (gamePhase === "active" || gamePhase === "ended") {
                  navigate("/board");
                }
              }
            }}
            onDismiss={() => {
              localStorage.removeItem("ruflo_room");
              setDismissed(true);
              toast.info("Saved room cleared — you can create or join a new room");
            }}
          />
        ) : !room.roomCode ? (
          <OnlineLobby
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            error={room.error}
          />
        ) : room.roomCode && !room.isGameActive ? (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Waiting Room */}
            <div className="flex-1">
              <WaitingRoom
                roomCode={room.roomCode}
                players={room.players}
                isHost={room.isHost}
                onStartGame={handleStartGame}
                onLeave={handleLeaveRoom}
              />
            </div>
            {/* Host team management panel */}
            {room.isHost && (
              <div className="w-full lg:w-80">
                <div className="p-5 rounded-2xl"
                  style={{ background: "var(--color-glass-bg)", border: "1px solid var(--color-glass-border)" }}>
                  <h3 className="text-sm font-display font-semibold mb-4" style={{ color: "var(--color-fg-default)" }}>
                    Your Teams ({teams.length})
                  </h3>

                  {teams.length === 0 ? (
                    <p className="text-xs mb-4" style={{ color: "var(--color-fg-faint)" }}>
                      Add teams for the game. Each team needs a name.
                    </p>
                  ) : (
                    <div className="space-y-2 mb-4">
                      {teams.map((team) => (
                        <div key={team.id} className="flex items-center gap-2 p-2 rounded-lg"
                          style={{ background: "var(--color-bg-elevated)" }}>
                          <div className="w-6 h-6 rounded flex items-center justify-center text-[10px]"
                            style={{ backgroundColor: team.color + "30", color: team.color }}>
                            <TeamIconDisplay icon={team.icon} size={12} />
                          </div>
                          <span className="text-xs flex-1 truncate" style={{ color: "var(--color-fg-default)" }}>{team.name}</span>
                          <button onClick={() => removeTeam(team.id)}
                            className="text-[10px] opacity-50 hover:opacity-100"
                            style={{ color: "var(--color-accent-danger)" }}>
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input value={teamName} onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Team name" maxLength={24}
                      className="glass-input flex-1 text-xs"
                      onKeyDown={(e) => e.key === "Enter" && addHostTeam()} />
                    <Button onClick={addHostTeam} variant="primary" size="sm">
                      <Plus size={14} />
                    </Button>
                  </div>

                  {teams.length >= 2 && room.isHost && (
                    <p className="text-[10px] mt-3 text-center" style={{ color: "var(--color-accent-success)" }}>
                      Teams ready — click Start Game when ready
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
