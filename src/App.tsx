import { useState, useCallback, useEffect, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from "react-router-dom";
import { Users, LayoutDashboard, Trophy, ScrollText, Eye, Settings } from "lucide-react";
import { Toaster } from "sonner";
import { HeroPage } from "./pages/HeroPage";
import { SetupPage } from "./pages/SetupPage";
import { BoardPage } from "./pages/BoardPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { LogsPage } from "./pages/LogsPage";
import { SpectatorPage } from "./pages/SpectatorPage";
import { SettingsPage } from "./pages/SettingsPage";
import { BrandLogo } from "./components/shared/BrandLogo";
import { SplashScreen } from "./components/shared/SplashScreen";
import { InstallPrompt } from "./components/shared/InstallPrompt";
import { useSettingsStore } from "./store/useSettingsStore";

const navItems = [
  { to: "/setup", icon: Users, label: "Setup" },
  { to: "/board", icon: LayoutDashboard, label: "Board" },
  { to: "/spectate", icon: Eye, label: "Spectate" },
  { to: "/leaderboard", icon: Trophy, label: "Leaderboard" },
  { to: "/logs", icon: ScrollText, label: "Logs" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

function Sidebar() {
  const navigate = useNavigate();

  return (
    <nav
      className="fixed left-0 top-0 h-full w-[72px] backdrop-blur-xl border-r border-white/[0.04] flex flex-col items-center py-5 z-50"
      style={{ background: "var(--color-bg-sidebar)" }}
    >
      {/* Brand Logo — navigates to hero page */}
      <div className="mb-8 flex flex-col items-center gap-1">
        <button
          onClick={() => navigate("/")}
          className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110"
          style={{
            background: "var(--color-accent-primary-muted)",
            border: "1px solid var(--color-accent-primary-muted)",
          }}
          aria-label="Go to home page"
          title="Home"
        >
          <BrandLogo size={36} />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex flex-col gap-2 flex-1">
        {navItems.map(({ to, icon: Icon, label }) => (              <NavLink
            key={to}
            to={to}
            end={to === "/"}
            aria-label={label}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all ${
                isActive
                  ? "text-accent-primary"
                  : "hover:bg-white/[0.03]"
              }`
            }
            style={({ isActive }) =>
              isActive
                ? {
                    background: "var(--color-accent-primary-muted)",
                    border: "1px solid var(--color-accent-primary-muted)",
                  }
                : undefined
            }
          >
            <Icon size={20} aria-hidden="true" />
            <span className="text-[10px] font-display font-medium" style={{ color: "var(--color-fg-muted)" }}>{label}</span>
          </NavLink>
        ))}
      </div>

      {/* Version */}
      <div className="mt-auto">
        <span className="text-[10px] font-mono" style={{ color: "var(--color-fg-faint)" }}>v2.0</span>
      </div>
    </nav>
  );
}

function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[72px] relative z-10 min-h-0 overflow-y-auto"
        style={{ background: "var(--color-bg-base)" }}>
        <Routes>
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/board" element={<BoardPage />} />
          <Route path="/spectate" element={<SpectatorPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/app" element={<Navigate to="/setup" replace />} />
        </Routes>
      </main>
    </div>
  );
}

/**
 * Applies the current theme (dark/light) to the document root element
 * so CSS variables cascade correctly.
 */
function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return <>{children}</>;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <ThemeProvider>
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
      {!showSplash && (
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "var(--color-bg-surface)",
                border: "1px solid var(--color-glass-border)",
                color: "var(--color-fg-default)",
                borderRadius: "12px",
                fontFamily: '"General Sans", system-ui, sans-serif',
              },
            }}
          />
          <InstallPrompt />
          <Routes>
            <Route path="/" element={<HeroPage />} />
            <Route path="/*" element={<AppLayout />} />
          </Routes>
        </BrowserRouter>
      )}
    </ThemeProvider>
  );
}
