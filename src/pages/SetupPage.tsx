import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit3, Trash2, Lock, Users } from "lucide-react";
import { useGameStore, TEAM_ICONS, type TeamIcon } from "../store/useGameStore";
import { TeamIconDisplay } from "../components/shared/TeamIconDisplay";
import { PanelShell } from "../components/shared/PanelShell";
import { Modal } from "../components/shared/Modal";
import { ConfirmDialog } from "../components/shared/ConfirmDialog";
import { Badge } from "../components/shared/Badge";
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

export function SetupPage() {
  const { teams, gamePhase, addTeam, updateTeam, removeTeam } = useGameStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState(TEAM_COLORS[0].value);
  const [selectedIcon, setSelectedIcon] = useState<TeamIcon>("sword");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const isLocked = gamePhase !== "idle";

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
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white">
              Team Registration
            </h1>
            <p className="text-white/40 mt-1">
              Register teams for the Riddle Rush challenge
            </p>
          </div>
          <button
            onClick={openAddModal}
            disabled={isLocked}
            className={`glass-button flex items-center gap-2 px-5 py-3 font-display font-semibold transition-all ${
              isLocked
                ? "text-white/20 cursor-not-allowed"
                : "text-white"
            }`}                style={isLocked ? undefined : { background: 'var(--color-glass-jade-20)', borderColor: 'var(--color-glass-jade-20)' }}
          >
            {isLocked ? <Lock size={18} /> : <Plus size={18} />}
            Add Team
          </button>
        </div>

        {/* Locked banner */}
        {isLocked && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 glass-panel p-4 flex items-center gap-3"
            style={{ borderColor: 'rgba(255, 184, 48, 0.2)', background: 'rgba(255, 184, 48, 0.05)' }}
          >
            <Lock size={18} className="text-accent-gold shrink-0" />
            <p className="text-accent-gold text-sm font-medium">
              Registration is locked — the game has already started.
            </p>
          </motion.div>
        )}

        {/* Team grid */}
        {teams.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'var(--color-glass-jade-08)', border: '1px solid var(--color-glass-jade-12)' }}>
              <Users size={28} className="text-jade/40" />
            </div>
            <p className="text-white/40 text-lg font-display">No teams registered yet</p>
            <p className="text-white/25 text-sm mt-1">
              Add teams to start the game
            </p>
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
                          <p className="text-white/50 text-sm flex items-center gap-2">
                            <Users size={14} className="text-white/30" />
                            {team.participants.map((p) => p.name).join(" & ")}
                          </p>
                        </div>
                      </div>
                      {!isLocked && (
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => openEditModal(team.id)}
                            className="glass-button p-2 text-white/40 hover:text-white"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(team.id)}
                            className="glass-button p-2 text-danger/60 hover:text-danger"
                            style={{ background: 'rgba(225, 29, 60, 0.08)' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </PanelShell>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTeam ? "Edit Team" : "Add Team"}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-display font-medium text-white/60 mb-1.5">
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
            <label className="block text-sm font-display font-medium text-white/60 mb-1.5">
              Participant 1
            </label>
            <input
              {...register("participant1")}
              placeholder="Name"
              className="glass-input w-full"
            />
            {errors.participant1 && (
              <p className="text-danger text-sm mt-1">
                {errors.participant1.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-display font-medium text-white/60 mb-1.5">
              Participant 2
            </label>
            <input
              {...register("participant2")}
              placeholder="Name"
              className="glass-input w-full"
            />
            {errors.participant2 && (
              <p className="text-danger text-sm mt-1">
                {errors.participant2.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-display font-medium text-white/60 mb-2">
              Team Color
            </label>
            <div className="flex gap-2">
              {TEAM_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={`w-9 h-9 rounded-xl transition-all ${
                    selectedColor === color.value
                      ? "ring-2 ring-white/80 scale-110"
                      : "hover:scale-105 hover:ring-1 hover:ring-white/20"
                  }`}
                  style={{
                    backgroundColor: color.value + "30",
                    border: `2px solid ${selectedColor === color.value ? color.value : color.value + "40"}`,
                  }}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-display font-medium text-white/60 mb-2">
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
                    backgroundColor: selectedIcon === iconName
                      ? "var(--color-accent-primary-muted)"
                      : "var(--color-bg-elevated)",
                    border: `2px solid ${
                      selectedIcon === iconName
                        ? "var(--color-accent-primary)"
                        : "rgba(255,255,255,0.06)"
                    }`,
                    color: selectedIcon === iconName
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
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="glass-button px-4 py-2.5 text-white/60 hover:text-white"
            >
              Cancel
            </button>
          <button
            type="submit"
            className="glass-button px-6 py-2.5 font-display font-semibold text-white"
            style={{ background: 'var(--color-glass-jade-25)', borderColor: 'var(--color-glass-jade-30)' }}
          >
              {editingTeam ? "Save Changes" : "Add Team"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
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
