import { useSettingsStore } from "../store/useSettingsStore";
import { motion } from "framer-motion";
import { Monitor, Eye, EyeOff, Sun, Moon } from "lucide-react";
import { PanelShell } from "../components/shared/PanelShell";
import { TunnelBackground } from "../components/shared/TunnelBackground";

export function SettingsPage() {
  const { backgroundIntensity, setBackgroundIntensity, theme, setTheme } = useSettingsStore();
  const isOff = backgroundIntensity === 0;
  const isLow = backgroundIntensity > 0 && backgroundIntensity < 40;
  const isMedium = backgroundIntensity >= 40 && backgroundIntensity < 75;

  const intensityLabel = isOff
    ? "Off"
    : isLow
      ? "Low"
      : isMedium
        ? "Medium"
        : "Full";

  const presetButtons = [
    { label: "Off", value: 0, icon: EyeOff },
    { label: "Low", value: 30, icon: Eye },
    { label: "Medium", value: 60, icon: Eye },
    { label: "Full", value: 100, icon: Eye },
  ] as const;

  return (
    <div className="min-h-screen p-6">
      <TunnelBackground />
      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "var(--color-glass-jade-15)",
              border: "1px solid var(--color-glass-jade-25)",
            }}
          >
            <Monitor size={20} className="text-jade" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold" style={{ color: "var(--color-fg-default)" }}>
              Settings
            </h1>
            <p className="mt-1" style={{ color: "var(--color-fg-muted)" }}>
              Adjust visual preferences and performance options
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Background intensity */}
          <PanelShell title="Background Effects" variant="tinted">
            <div className="space-y-6">
              {/* Preset buttons */}
              <div className="flex gap-2">
                {presetButtons.map(({ label, value, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setBackgroundIntensity(value)}
                    className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl transition-all ${
                      backgroundIntensity === value
                        ? "glass-panel-tinted"
                        : "glass-panel hover:bg-white/[0.03]"
                    }`}
                    style={
                      backgroundIntensity === value
                        ? {
                            borderColor: "var(--color-glass-jade-30)",
                            background: "var(--color-glass-jade-08)",
                          }
                        : undefined
                    }
                  >
                    <Icon
                      size={20}
                      className={
                        backgroundIntensity === value
                          ? "text-jade"
                          : ""
                      }
                      style={backgroundIntensity !== value ? { color: "var(--color-fg-subtle)" } : undefined}
                    />
                    <span
                      className="text-xs font-display font-medium"
                      style={{ color: backgroundIntensity === value ? "var(--color-fg-default)" : "var(--color-fg-muted)" }}
                    >
                      {label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-display font-medium" style={{ color: "var(--color-fg-muted)" }}>
                    Intensity
                  </label>
                  <div className="flex items-center gap-2">
                    <motion.div
                      key={intensityLabel}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="px-3 py-1 rounded-lg text-xs font-mono font-bold"
                      style={{
                        background: isOff
                          ? "var(--color-accent-danger-muted)"
                          : "var(--color-accent-primary-muted)",
                        color: isOff ? "var(--color-accent-danger)" : "var(--color-accent-primary)",
                        border: `1px solid ${
                          isOff
                            ? "var(--color-accent-danger-muted)"
                            : "var(--color-accent-primary-muted)"
                        }`,
                      }}
                    >
                      {intensityLabel}
                    </motion.div>
                    <span className="text-xs font-mono w-8 text-right" style={{ color: "var(--color-fg-subtle)" }}>
                      {backgroundIntensity}%
                    </span>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={backgroundIntensity}
                    onChange={(e) =>
                      setBackgroundIntensity(Number(e.target.value))
                    }
                    className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/[0.06] accent-jade"
                    style={{
                      background: `linear-gradient(to right, var(--color-jade) ${backgroundIntensity}%, rgba(255,255,255,0.06) ${backgroundIntensity}%)`,
                    }}
                  />
                  {/* Tick marks */}
                  <div className="flex justify-between px-0.5 mt-1">
                    {[0, 25, 50, 75, 100].map((tick) => (
                      <span
                        key={tick}
                        className="text-[10px] font-mono"
                        style={{ color: "var(--color-fg-faint)" }}
                      >
                        {tick}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <p className="text-xs font-display font-medium" style={{ color: "var(--color-fg-muted)" }}>
                  Preview
                </p>
                <div className="h-20 rounded-xl overflow-hidden relative"
                  style={{
                    background: "var(--color-bg-base)",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  {/* Simulated blobs at current intensity */}
                  {!isOff && (
                    <div className="absolute inset-0">
                      <div
                        className="absolute w-[200px] h-[200px] rounded-full blur-3xl"
                        style={{
                          top: "15%",
                          left: "10%",
                          background: `rgba(47, 217, 168, ${0.05 * (backgroundIntensity / 100)})`,
                          transform: "translate(-30%, -30%)",
                        }}
                      />
                      <div
                        className="absolute w-[180px] h-[180px] rounded-full blur-3xl"
                        style={{
                          bottom: "10%",
                          right: "15%",
                          background: `rgba(198, 241, 53, ${0.025 * (backgroundIntensity / 100)})`,
                          transform: "translate(30%, 30%)",
                        }}
                      />
                      <div
                        className="absolute w-[150px] h-[150px] rounded-full blur-3xl"
                        style={{
                          top: "50%",
                          left: "50%",
                          background: `rgba(225, 29, 60, ${0.02 * (backgroundIntensity / 100)})`,
                          transform: "translate(-50%, -50%)",
                        }}
                      />
                    </div>
                  )}
                  {isOff && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-mono" style={{ color: "var(--color-fg-faint)" }}>
                        Background disabled
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance note */}
              <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: "var(--color-bg-elevated)", borderLeft: "2px solid var(--color-accent-success)" }}>
                <p className="text-xs leading-relaxed" style={{ color: "var(--color-fg-muted)" }}>
                  The animated background uses a single canvas with
                  requestAnimationFrame. Reducing intensity lowers GPU fill-rate
                  pressure — useful on integrated graphics or battery power.
                </p>
              </div>
            </div>
          </PanelShell>

          {/* Theme toggle */}
          <PanelShell title="Appearance" variant="tinted">
            <div className="space-y-4">
              <p className="text-sm font-display" style={{ color: "var(--color-fg-muted)" }}>
                Choose your visual theme.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl transition-all ${
                    theme === "dark"
                      ? "glass-panel-tinted"
                      : "glass-panel hover:bg-white/[0.03]"
                  }`}
                  style={
                    theme === "dark"
                      ? {
                          borderColor: "var(--color-glass-jade-30)",
                          background: "var(--color-glass-jade-08)",
                        }
                      : undefined
                  }
                >
                  <Moon
                    size={20}
                    className={
                      theme === "dark" ? "text-jade" : ""
                    }
                    style={theme !== "dark" ? { color: "var(--color-fg-subtle)" } : undefined}
                  />
                  <span
                    className="text-xs font-display font-medium"
                    style={{ color: theme === "dark" ? "var(--color-fg-default)" : "var(--color-fg-muted)" }}
                  >
                    Dark
                  </span>
                </button>
                <button
                  onClick={() => setTheme("light")}
                  className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl transition-all ${
                    theme === "light"
                      ? "glass-panel-tinted"
                      : "glass-panel hover:bg-white/[0.03]"
                  }`}
                  style={
                    theme === "light"
                      ? {
                          borderColor: "var(--color-glass-jade-25)",
                          background: "var(--color-glass-jade-08)",
                        }
                      : undefined
                  }
                >
                  <Sun
                    size={20}
                    className={
                      theme === "light" ? "text-jade" : ""
                    }
                    style={theme !== "light" ? { color: "var(--color-fg-subtle)" } : undefined}
                  />
                  <span
                    className="text-xs font-display font-medium"
                    style={{ color: theme === "light" ? "var(--color-fg-default)" : "var(--color-fg-muted)" }}
                  >
                    Light
                  </span>
                </button>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: "var(--color-bg-elevated)", borderLeft: "2px solid var(--color-jade)" }}>
                <p className="text-xs leading-relaxed" style={{ color: "var(--color-fg-muted)" }}>
                  Dark mode for immersive low-light sessions with deep charcoal and jade accents. Light mode for a warm, paper-toned daytime theme.
                </p>
              </div>
            </div>
          </PanelShell>
        </div>
      </div>
    </div>
  );
}
