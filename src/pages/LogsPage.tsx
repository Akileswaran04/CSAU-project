import { ActionLog } from "../components/controls/ActionLog";
import { useLogStore } from "../store/useLogStore";
import { Download } from "lucide-react";
import { toast } from "sonner";

export function LogsPage() {
  const entries = useLogStore((s) => s.entries);

  const handleExport = () => {
    try {
      const csv = [
        ["Timestamp", "Team", "Type", "Message"],
        ...entries.map((e) => [
          new Date(e.timestamp).toISOString(),
          e.teamName,
          e.type,
          e.message,
        ]),
      ]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `riddle-rush-log-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Log exported as CSV");
    } catch {
      toast.error("Failed to export log");
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white">
              Game Log
            </h1>
            <p className="text-white/40 mt-1">
              Complete event history — {entries.length} entries
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={entries.length === 0}
            className="glass-button flex items-center gap-2 px-4 py-2.5 font-display font-medium text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>

        <ActionLog />
      </div>
    </div>
  );
}
