import { useState, useCallback, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit3,
  Trash2,
  Lock,
  Users,
  Wifi,
  WifiOff,
  Copy,
  Check,
  LogOut,
  UserPlus,
  DoorOpen,
  Globe,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useGameStore, TEAM_ICONS, type TeamIcon, type GameMode } from "../store/useGameStore";
import { useMultiplayer } from "../hooks/useMultiplayer";
import { TeamIconDisplay } from "../components/shared/TeamIconDisplay";
import { PanelShell } from "../components/shared/PanelShell";
import { Modal } from "../components/shared/Modal";
import { ConfirmDialog } from "../components/shared/ConfirmDialog";
import { Badge } from "../components/shared/Badge";
import { Button } from "../components/ui/button";
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
   Online Room Panel — Create / Join / Manage multiplayer rooms
   ═══════════════════════════════════════════════════════════════════════════ */
function OnlineRoomPanel() {
  const multiplayer = useMultiplayer();
  const { teams, gamePhase, addTeam, updateTeam, removeTeam } = useGameStore();
  const isLocked = gamePhase !== "idle";

  const mountedRef = useRef(true);

  // Cleanup: disconnect on unmount (e.g. switching back to offline mode)
  // `disconnect` is stable — created with useCallback([], []) in the hook
  const disconnectRef = useRef(multiplayer.disconnect);
  disconnectRef.current = multiplayer.disconnect;

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      disconnectRef.current();
    };
  }, []);

  const [playerName, setPlayerName] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [joining, setJoining] = useState(false);
  const [creating, setCreating] = useState(false);

  // Team management (same as offline but re-used here)
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

  const handleCreateRoom = useCallback(async () => {
    if (!playerName.trim()) {
      toast.error("Enter a player name first");
      return;
    }
    setCreating(true);
    await multiplayer.createRoom(playerName.trim());
    if (mountedRef.current) setCreating(false);
  }, [playerName, multiplayer]);

  const handleJoinRoom = useCallback(async () => {
    if (!playerName.trim()) {
      toast.error("Enter a player name first");
      return;
    }
    if (!roomCodeInput.trim()) {
      toast.error("Enter a room code");
      return;
    }
    setJoining(true);
    const ok = await multiplayer.joinRoom(roomCodeInput.trim().toUpperCase(), playerName.trim());
    if (mountedRef.current) {
      setJoining(false);
      if (ok) {
        setRoomCodeInput("");
      }
    }
  }, [playerName, roomCodeInput, multiplayer]);

  const handleCopyRoomCode = async () => {
    if (!multiplayer.roomId) return;
    try {
      await navigator.clipboard.writeText(multiplayer.roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Room code copied!");
    } catch {
      toast.error("Could not copy");
    }
  };

  // ─── Connected: Show room + players ───
  if (multiplayer.isConnected && multiplayer.roomId) {
    return (
      <div className="space-y-6">
        {/* Room header */}
        <div className="glass-panel-tinted p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "var(--color-accent-primary-muted)", border: "1px solid var(--color-accent-primary-muted)" }}>
                <Globe size={20} className="text-accent-primary" />
              </div>
              <div>
                <h3 className="text-white font-display font-semibold text-sm">
                  Room Connected
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-success animate-pulse" />
                  <span className="text-accent-success text-[10px] font-mono uppercase tracking-wider">
                    Live
                  </span>
                </div>
              </div>
            </div>
            <Button
              onClick={multiplayer.disconnect}
              variant="ghost"
              size="sm"
              className="text-white/40 hover:text-danger"
              aria-label="Disconnect from room"
            >
              <LogOut size={16} />
              Leave
            </Button>
          </div>

          {/* Room code — large, centered, copyable */}
          <div className="text-center py-3">
            <p className="text-white/30 text-xs font-display mb-1.5">Room Code</p>
            <button
              onClick={handleCopyRoomCode}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl transition-all hover:bg-white/[0.04]"
              aria-label="Copy room code"
            >
              <span className="text-3xl font-mono font-bold tracking-[0.15em] text-white">
                {multiplayer.roomId}
              </span>
              {copied ? (
                <Check size={18} className="text-accent-success" />
              ) : (
                <Copy size={18} className="text-white/30 hover:text-white/60" />
              )}
            </button>
            <p className="text-white/20 text-xs mt-1.5">Share this code with other players</p>
          </div>

          {/* Role badge */}
          <div className="flex justify-center">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono"
              style={{
                background: multiplayer.isHost
                  ? "var(--color-accent-primary-muted)"
                  : "var(--color-glass-white-04)",
                border: `1px solid ${
                  multiplayer.isHost
                    ? "var(--color-accent-primary-muted)"
                    : "var(--color-glass-white-06)"
                }`,
                color: multiplayer.isHost
                  ? "var(--color-accent-primary)"
                  : "var(--color-fg-muted)",
              }}
            >
              {multiplayer.isHost ? "👑 Host" : "👤 Player"}
            </span>
          </div>
        </div>

        {/* Players list */}
        <PanelShell title={`Players (${multiplayer.players.length})`} variant="tinted">
          <div className="space-y-2">
            {multiplayer.players.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-4">No players yet</p>
            ) : (
              multiplayer.players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl"
                  style={{
                    background: player.isHost
                      ? "var(--color-glass-blue-06)"
                      : "var(--color-glass-white-02)",
                    border: `1px solid ${
                      player.isHost
                        ? "var(--color-glass-blue-10)"
                        : "var(--color-glass-white-04)"
                    }`,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono"
                    style={{
                      background: player.isHost
                        ? "var(--color-accent-primary-muted)"
                        : "var(--color-glass-white-06)",
                      color: player.isHost
                        ? "var(--color-accent-primary)"
                        : "var(--color-fg-muted)",
                    }}
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-display font-medium truncate">
                      {player.name}
                    </p>
                    <p className="text-white/30 text-[10px] font-mono">
                      {player.isHost ? "Host" : "Connected"}
                    </p>
                  </div>
                  {player.isHost && (
                    <span className="text-[10px] font-mono" style={{ color: "var(--color-accent-gold)" }}>
                      HOST
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </PanelShell>

        {/* Host: team management */}
        {multiplayer.isHost && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-white font-display font-semibold text-sm">Your Teams</h3>
              <Button
                onClick={openAddModal}
                disabled={isLocked}
                variant="primary"
                size="sm"
              >
                <Plus size={14} />
                Add Team
              </Button>
            </div>

            {teams.length === 0 ? (
              <div className="text-center py-6 glass-panel">
                <Users size={24} className="mx-auto text-white/15 mb-2" />
                <p className="text-white/30 text-sm">No teams yet — add teams for your game</p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
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
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: team.color + "20",
                              border: `1px solid ${team.color}40`,
                              color: team.color,
                            }}
                          >
                            <TeamIconDisplay icon={team.icon} size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-white font-display font-medium text-sm truncate">
                                {team.name}
                              </h4>
                              <Badge variant="default" size="sm">
                                #{index + 1}
                              </Badge>
                            </div>
                            <p className="text-white/30 text-xs font-mono mt-0.5">
                              {team.participants.map((p) => p.name).join(" & ")}
                            </p>
                          </div>
                          {!isLocked && (
                            <div className="flex gap-1 shrink-0">
                              <Button
                                onClick={() => openEditModal(team.id)}
                                variant="ghost"
                                size="sm"
                                className="text-white/30 hover:text-white"
                                aria-label="Edit team"
                              >
                                <Edit3 size={14} />
                              </Button>
                              <Button
                                onClick={() => setDeleteConfirm(team.id)}
                                variant="ghost"
                                size="sm"
                                className="text-white/30 hover:text-danger"
                                aria-label="Remove team"
                              >
                                <Trash2 size={14} />
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
          </>
        )}

        {/* Non-host: see teams from host */}
        {!multiplayer.isHost && teams.length > 0 && (
          <>
            <h3 className="text-white font-display font-semibold text-sm">Teams</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {teams.map((team, index) => (
                <PanelShell key={team.id} variant="tinted">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: team.color + "20",
                        border: `1px solid ${team.color}40`,
                        color: team.color,
                      }}
                    >
                      <TeamIconDisplay icon={team.icon} size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-display font-medium text-sm truncate">
                        {team.name}
                      </p>
                      <p className="text-white/30 text-xs font-mono">
                        #{index + 1} · {team.participants.map((p) => p.name).join(" & ")}
                      </p>
                    </div>
                  </div>
                </PanelShell>
              ))}
            </div>
          </>
        )}

        {/* Team Modals (same as offline) */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingTeam ? "Edit Team" : "Add Team"}
          size="md"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-display font-medium text-fg-muted mb-1.5">
                Team Name
              </label>
              <input
                {...register("name")}
                placeholder="Enter team name"
                className="glass-input w-full"
              />
              {errors.name && (
                <p className="text-danger text-sm mt-1">{errors.name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-display font-medium text-fg-muted mb-1.5">
                Participant 1
              </label>
              <input
                {...register("participant1")}
                placeholder="Name"
                className="glass-input w-full"
              />
              {errors.participant1 && (
                <p className="text-danger text-sm mt-1">{errors.participant1.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-display font-medium text-fg-muted mb-1.5">
                Participant 2
              </label>
              <input
                {...register("participant2")}
                placeholder="Name"
                className="glass-input w-full"
              />
              {errors.participant2 && (
                <p className="text-danger text-sm mt-1">{errors.participant2.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-display font-medium text-fg-muted mb-2">
                Team Color
              </label>
              <div className="flex gap-2">
                {TEAM_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setSelectedColor(c.value)}
                    className={`w-9 h-9 rounded-xl transition-all ${
                      selectedColor === c.value
                        ? "ring-2 ring-white/80 scale-110"
                        : "hover:scale-105 hover:ring-1 hover:ring-white/20"
                    }`}
                    style={{
                      backgroundColor: c.value + "30",
                      border: `2px solid ${selectedColor === c.value ? c.value : c.value + "40"}`,
                    }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-display font-medium text-fg-muted mb-2">
                Team Icon
              </label>
              <div className="flex gap-2">
                {TEAM_ICONS.map((iconName) => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setSelectedIcon(iconName)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      selectedIcon === iconName
                        ? "ring-2 ring-accent-primary scale-110"
                        : "hover:scale-105 hover:ring-1 hover:ring-white/20"
                    }`}
                    style={{
                      backgroundColor:
                        selectedIcon === iconName
                          ? "var(--color-accent-primary-muted)"
                          : "var(--color-bg-elevated)",
                      border: `2px solid ${
                        selectedIcon === iconName
                          ? "var(--color-accent-primary)"
                          : "rgba(255,255,255,0.06)"
                      }`,
                      color:
                        selectedIcon === iconName
                          ? "var(--color-accent-primary)"
                          : "var(--color-fg-subtle)",
                    }}
                    title={iconName}
                  >
                    <TeamIconDisplay icon={iconName} size={16} />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" onClick={() => setIsModalOpen(false)} variant="secondary">
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {editingTeam ? "Save Changes" : "Add Team"}
              </Button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog
          isOpen={deleteConfirm !== null}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
          title="Remove Team"
          message="Are you sure you want to remove this team? This action cannot be undone."
          confirmLabel="Remove"
          variant="danger"
        />
      </div>
    );
  }

  // ─── Not connected: Show create / join options ───
  return (
    <div className="space-y-6">
      {/* Player name input */}
      <div className="glass-panel-tinted p-5">
        <label className="block text-sm font-display font-medium text-fg-muted mb-2">
          Your Player Name
        </label>
        <input
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter your display name"
          className="glass-input w-full"
          maxLength={24}
        />
      </div>

      {/* Create Room */}
      <PanelShell title="Create a Room" variant="tinted">
        <p className="text-white/40 text-sm mb-4 font-display">
          Start a new game room and invite other players to join
        </p>
        <Button
          onClick={handleCreateRoom}
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!playerName.trim() || creating}
        >
          {creating ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <UserPlus size={18} />
          )}
          {creating ? "Creating..." : "Create Room"}
        </Button>
      </PanelShell>

      {/* Join Room */}
      <PanelShell title="Join a Room" variant="tinted">
        <p className="text-white/40 text-sm mb-4 font-display">
          Enter the room code shared by the host
        </p>
        <div className="space-y-3">
          <input
            value={roomCodeInput}
            onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="e.g. ABC123"
            className="glass-input w-full text-center text-lg font-mono font-bold tracking-[0.15em] uppercase"
            maxLength={6}
          />
          <Button
            onClick={handleJoinRoom}
            variant="primary"
            size="lg"
            className="w-full"
            disabled={!playerName.trim() || !roomCodeInput.trim() || joining}
          >
            {joining ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <DoorOpen size={18} />
            )}
            {joining ? "Joining..." : "Join Room"}
          </Button>
        </div>
      </PanelShell>

      {/* Error display */}
      {multiplayer.error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-4 flex items-center gap-3"
          style={{
            borderColor: "rgba(229, 72, 77, 0.2)",
            background: "rgba(229, 72, 77, 0.05)",
          }}
        >
          <span className="text-danger text-sm flex-1 font-display">{multiplayer.error}</span>
          <Button
            onClick={() => multiplayer.disconnect()}
            variant="ghost"
            size="sm"
            className="text-white/40 hover:text-white"
          >
            <RefreshCw size={14} />
            Retry
          </Button>
        </motion.div>
      )}
    </div>
  );
}

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
      {/* Header */}
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

      {/* Locked banner */}
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

      {/* Team grid */}
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
                        <h3 className="text-lg font-display font-semibold text-white truncate">
                          {team.name}
                        </h3>
                        <Badge variant="default" size="sm">
                          #{index + 1}
                        </Badge>
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
                        <Button
                          onClick={() => openEditModal(team.id)}
                          variant="ghost"
                          size="sm"
                          className="text-fg-subtle hover:text-white"
                          aria-label="Edit team"
                        >
                          <Edit3 size={16} />
                        </Button>
                        <Button
                          onClick={() => setDeleteConfirm(team.id)}
                          variant="ghost"
                          size="sm"
                          className="text-fg-subtle hover:text-danger"
                          aria-label="Remove team"
                        >
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

      {/* Modals */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTeam ? "Edit Team" : "Add Team"}
        size="md"
      >
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
          <div>
            <label className="block text-sm font-display font-medium text-fg-muted mb-2">Team Color</label>
            <div className="flex gap-2">
              {TEAM_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setSelectedColor(c.value)}
                  className={`w-9 h-9 rounded-xl transition-all ${
                    selectedColor === c.value ? "ring-2 ring-white/80 scale-110" : "hover:scale-105 hover:ring-1 hover:ring-white/20"
                  }`}
                  style={{ backgroundColor: c.value + "30", border: `2px solid ${selectedColor === c.value ? c.value : c.value + "40"}` }}
                  title={c.label}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-display font-medium text-fg-muted mb-2">Team Icon</label>
            <div className="flex gap-2">
              {TEAM_ICONS.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setSelectedIcon(iconName)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    selectedIcon === iconName ? "ring-2 ring-accent-primary scale-110" : "hover:scale-105 hover:ring-1 hover:ring-white/20"
                  }`}
                  style={{
                    backgroundColor: selectedIcon === iconName ? "var(--color-accent-primary-muted)" : "var(--color-bg-elevated)",
                    border: `2px solid ${selectedIcon === iconName ? "var(--color-accent-primary)" : "rgba(255,255,255,0.06)"}`,
                    color: selectedIcon === iconName ? "var(--color-accent-primary)" : "var(--color-fg-subtle)",
                  }}
                  title={iconName}
                >
                  <TeamIconDisplay icon={iconName} size={16} />
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" onClick={() => setIsModalOpen(false)} variant="secondary">Cancel</Button>
            <Button type="submit" variant="primary">
              {editingTeam ? "Save Changes" : "Add Team"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Remove Team"
        message="Are you sure you want to remove this team? This action cannot be undone."
        confirmLabel="Remove"
        variant="danger"
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN: SetupPage
   ═══════════════════════════════════════════════════════════════════════════ */
export function SetupPage() {
  const { gamePhase, gameMode, setGameMode } = useGameStore();
  const isLocked = gamePhase !== "idle";

  const modeOptions: { id: GameMode; label: string; icon: typeof WifiOff; description: string }[] = [
    { id: "offline", label: "Local Game", icon: WifiOff, description: "Hot-seat multiplayer on this device" },
    { id: "online", label: "Online", icon: Wifi, description: "Play across devices via game server" },
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Game Mode Toggle */}
        <div className="mb-8">
          <div
            className="inline-flex rounded-xl p-1"
            style={{
              background: "var(--color-glass-white-04)",
              border: "1px solid var(--color-glass-white-06)",
            }}
          >
            {modeOptions.map(({ id, label, icon: Icon, description }) => (
              <button
                key={id}
                onClick={() => !isLocked && setGameMode(id)}
                disabled={isLocked}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-display font-medium transition-all duration-200 ${
                  gameMode === id ? "text-white" : "text-white/40 hover:text-white/70"
                } ${isLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                title={description}
              >
                {gameMode === id && (
                  <motion.div
                    layoutId="game-mode-bg"
                    className="absolute inset-0 rounded-lg"
                    style={{
                      background: "var(--color-glass-blue-10)",
                      border: "1px solid var(--color-glass-blue-20)",
                    }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  />
                )}
                <Icon size={16} className="relative z-10" aria-hidden="true" />
                <span className="relative z-10">{label}</span>
              </button>
            ))}
          </div>
          <p className="text-white/30 text-xs mt-2 font-display">
            {gameMode === "offline"
              ? "Add 2+ teams and play on this device — no server needed"
              : "Connect to the game server to play with others across devices"}
          </p>
        </div>

        {/* Mode-specific content */}
        {gameMode === "offline" ? <OfflineTeamPanel /> : <OnlineRoomPanel />}
      </div>
    </div>
  );
}
