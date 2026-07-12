import { useEffect, useCallback } from "react";
import { useSettingsStore } from "../store/useSettingsStore";
import { motion } from "framer-motion";
import {
  Monitor,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Volume2,
  Music,
} from "lucide-react";
import { PanelShell } from "../components/shared/PanelShell";
import { Toggle } from "../components/shared/Toggle";
import { TunnelBackground } from "../components/shared/TunnelBackground";
import { soundManager } from "../lib/sound";

export function SettingsPage() {
  const {
    backgroundIntensity,
    setBackgroundIntensity,
    theme,
    setTheme,
    musicVolume,
    sfxVolume,
    setMusicVolume,
    setSfxVolume,
  } = useSettingsStore();

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

  // Sync store volumes → sound manager
  useEffect(() => {
    soundManager.sfxVolume = sfxVolume / 100;
  }, [sfxVolume]);

  useEffect(() => {
    soundManager.musicVolume = musicVolume / 100;
  }, [musicVolume]);

  // Preview sound on sfx slider change
  const handleSfxChange = useCallback(
    (val: number) => {
      setSfxVolume(val);
      if (val > 0) {
        soundManager.play("buttonClick");
      }
    },
    [setSfxVolume],
  );

  return (
    <div className="min-h-screen p-6">
      <TunnelBackground />
      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-accent-primary-muted)",
            }}
          >
            <Monitor size={20} style={{ color: "var(--color-accent-primary)" }} />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold" style={{ color: "var(--color-fg-default)" }}>
              Settings
            </h1>
            <p className="mt-1" style={{ color: "var(--color-fg-muted)" }}>
              Adjust visual and audio preferences
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* ─── Audio Settings ─── */}
          <PanelShell title="Audio" variant="solid">
            <div className="space-y-6">
              {/* SFX Volume */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2
                      size={16}
                      style={{ color: "var(--color-fg-muted)" }}
                    />
                    <label
                      className="text-sm font-display font-medium"
                      style={{ color: "var(--color-fg-muted)" }}
                    >
                      Sound Effects
                    </label>
                  </div>
                  <motion.span
                    key={sfxVolume}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg"
                    style={{
                      background: "var(--color-bg-elevated)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      color:
                        sfxVolume === 0
                          ? "var(--color-accent-danger)"
                          : "var(--color-accent-primary)",
                    }}
                  >
                    {sfxVolume === 0 ? "Muted" : `${sfxVolume}%`}
                  </motion.span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={sfxVolume}
                  onChange={(e) => handleSfxChange(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, var(--color-accent-primary) ${sfxVolume}%, rgba(255,255,255,0.06) ${sfxVolume}%)`,
                    accentColor: "var(--color-accent-primary)",
                  }}
                />
                <div className="flex justify-between px-0.5">
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

              {/* Music Volume */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music
                      size={16}
                      style={{
                        color:
                          musicVolume > 0
                            ? "var(--color-accent-primary)"
                            : "var(--color-fg-muted)",
                      }}
                    />
                    <label
                      className="text-sm font-display font-medium"
                      style={{ color: "var(--color-fg-muted)" }}
                    >
                      Background Music
                    </label>
                  </div>
                  <motion.span
                    key={musicVolume}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg"
                    style={{
                      background: "var(--color-bg-elevated)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      color:
                        musicVolume === 0
                          ? "var(--color-accent-danger)"
                          : "var(--color-accent-primary)",
                    }}
                  >
                    {musicVolume === 0 ? "Off" : `${musicVolume}%`}
                  </motion.span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={musicVolume}
                  onChange={(e) => setMusicVolume(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, var(--color-accent-primary) ${musicVolume}%, rgba(255,255,255,0.06) ${musicVolume}%)`,
                    accentColor: "var(--color-accent-primary)",
                  }}
                />
                <div className="flex justify-between px-0.5">
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

              {/* Audio tip */}
              <div
                className="flex items-start gap-2 p-3 rounded-xl"
                style={{
                  background: "var(--color-bg-elevated)",
                  borderLeft: "2px solid var(--color-accent-primary)",
                }}
              >
                <p className="text-xs leading-relaxed" style={{ color: "var(--color-fg-muted)" }}>
                  Sound effects and music are generated procedurally — no audio files needed.
                  Click the SFV slider to preview a sound. Music plays automatically during the game.
                </p>
              </div>
            </div>
          </PanelShell>

          {/* ─── Background intensity ─── */}
          <PanelShell title="Background Effects" variant="solid">
            <div className="space-y-6">
              {/* Preset buttons — flat segmented control */}
              <div className="flex gap-2">
                {presetButtons.map(({ label, value, icon: Icon }) => {
                  const isActive = backgroundIntensity === value;
                  return (
                    <button
                      key={value}
                      onClick={() => setBackgroundIntensity(value)}
                      className="flex-1 flex flex-col items-center gap-2 py-4 rounded-xl transition-all cursor-pointer"
                      style={{
                        background: "var(--color-bg-elevated)",
                        border: isActive
                          ? "2px solid var(--color-accent-primary)"
                          : "1px solid rgba(255,255,255,0.06)",
                        boxShadow: isActive
                          ? "0 0 20px var(--color-accent-primary-muted)"
                          : "none",
                      }}
                      onPointerEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)";
                        }
                      }}
                      onPointerLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = "";
                        }
                      }}
                    >
                      <Icon
                        size={20}
                        style={{
                          color: isActive
                            ? "var(--color-accent-primary)"
                            : "var(--color-fg-subtle)",
                        }}
                      />
                      <span
                        className="text-xs font-display font-medium"
                        style={{
                          color: isActive
                            ? "var(--color-fg-default)"
                            : "var(--color-fg-muted)",
                        }}
                      >
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-display font-medium" style={{ color: "var(--color-fg-muted)" }}>
                    Intensity
                  </label>
                  <div className="flex items-center gap-2">
                    {/* Value pill — solid bg-elevated with colored dot */}
                    <motion.div
                      key={intensityLabel}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold"
                      style={{
                        background: "var(--color-bg-elevated)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        color: isOff
                          ? "var(--color-accent-danger)"
                          : "var(--color-accent-primary)",
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: isOff
                            ? "var(--color-accent-danger)"
                            : "var(--color-accent-primary)",
                        }}
                      />
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
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, var(--color-accent-primary) ${backgroundIntensity}%, rgba(255,255,255,0.06) ${backgroundIntensity}%)`,
                      accentColor: "var(--color-accent-primary)",
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
                  {/* Simulated blobs at current intensity — using accent tokens */}
                  {!isOff && (
                    <div className="absolute inset-0">
                      <div
                        className="absolute w-[200px] h-[200px] rounded-full blur-3xl"
                        style={{
                          top: "15%",
                          left: "10%",
                          background: `var(--color-accent-primary-glow)`,
                          opacity: 0.05 * (backgroundIntensity / 100),
                          transform: "translate(-30%, -30%)",
                        }}
                      />
                      <div
                        className="absolute w-[180px] h-[180px] rounded-full blur-3xl"
                        style={{
                          bottom: "10%",
                          right: "15%",
                          background: `var(--color-accent-success-muted)`,
                          opacity: backgroundIntensity / 100,
                          transform: "translate(30%, 30%)",
                        }}
                      />
                      <div
                        className="absolute w-[150px] h-[150px] rounded-full blur-3xl"
                        style={{
                          top: "50%",
                          left: "50%",
                          background: `var(--color-accent-danger-muted)`,
                          opacity: backgroundIntensity / 100,
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

              {/* Performance note — solid bg-elevated + colored left border */}
              <div
                className="flex items-start gap-2 p-3 rounded-xl"
                style={{
                  background: "var(--color-bg-elevated)",
                  borderLeft: "2px solid var(--color-accent-success)",
                }}
              >
                <p className="text-xs leading-relaxed" style={{ color: "var(--color-fg-muted)" }}>
                  The animated background uses a single canvas with
                  requestAnimationFrame. Reducing intensity lowers GPU fill-rate
                  pressure — useful on integrated graphics or battery power.
                </p>
              </div>
            </div>
          </PanelShell>

          {/* ─── Theme toggle ─── */}
          <PanelShell title="Appearance" variant="solid">
            <div className="space-y-4">
              <p className="text-sm font-display" style={{ color: "var(--color-fg-muted)" }}>
                Choose your visual theme.
              </p>

              {/* Flat segmented control for theme */}
              <div className="flex gap-2">
                {([
                  { value: "dark" as const, label: "Dark", icon: Moon },
                  { value: "light" as const, label: "Light", icon: Sun },
                ]).map(({ value, label, icon: Icon }) => {
                  const isActive = theme === value;
                  return (
                    <button
                      key={value}
                      onClick={() => setTheme(value)}
                      className="flex-1 flex flex-col items-center gap-2 py-4 rounded-xl transition-all cursor-pointer"
                      style={{
                        background: "var(--color-bg-elevated)",
                        border: isActive
                          ? "2px solid var(--color-accent-primary)"
                          : "1px solid rgba(255,255,255,0.06)",
                        boxShadow: isActive
                          ? "0 0 20px var(--color-accent-primary-muted)"
                          : "none",
                      }}
                      onPointerEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)";
                        }
                      }}
                      onPointerLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = "";
                        }
                      }}
                    >
                      <Icon
                        size={20}
                        style={{
                          color: isActive
                            ? "var(--color-accent-primary)"
                            : "var(--color-fg-subtle)",
                        }}
                      />
                      <span
                        className="text-xs font-display font-medium"
                        style={{
                          color: isActive
                            ? "var(--color-fg-default)"
                            : "var(--color-fg-muted)",
                        }}
                      >
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Theme note — solid callout */}
              <div
                className="flex items-start gap-2 p-3 rounded-xl"
                style={{
                  background: "var(--color-bg-elevated)",
                  borderLeft: "2px solid var(--color-accent-primary)",
                }}
              >
                <p className="text-xs leading-relaxed" style={{ color: "var(--color-fg-muted)" }}>
                  Dark mode for immersive low-light sessions with deep charcoal and blue accents.
                  Light mode for a warm, paper-toned daytime theme.
                </p>
              </div>

              {/* Future settings toggle placeholder */}
              <div className="pt-2 border-t border-white/[0.04]">
                <Toggle
                  checked={theme === "dark"}
                  onChange={(v) => setTheme(v ? "dark" : "light")}
                  label="Dark mode"
                  description="Toggle between dark and light themes"
                />
              </div>
            </div>
          </PanelShell>
        </div>
      </div>
    </div>
  );
}
