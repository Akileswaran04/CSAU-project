import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * PWA install prompt that appears when the browser fires `beforeinstallprompt`.
 *
 * - Listens for the install event once on mount
 * - Shows a sleek bottom-sheet-style banner with an install button
 * - Dismisses permanently once the user installs or explicitly closes it
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setDismissed(false);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  const show = deferredPrompt !== null && !dismissed;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-md"
        >
          <div
            className="relative flex items-center gap-3 rounded-2xl p-4 pr-12 shadow-2xl"
            style={{
              background: "var(--color-bg-elevated)",
              border: "1px solid var(--color-glass-border)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
            }}
          >
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/[0.06] transition-colors cursor-pointer"
              style={{ color: "var(--color-fg-muted)" }}
              aria-label="Dismiss install prompt"
            >
              <X size={14} />
            </button>

            {/* Icon */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "var(--color-accent-primary-muted)",
                border: "1px solid var(--color-glass-border)",
              }}
            >
              <Download
                size={22}
                style={{ color: "var(--color-accent-primary)" }}
              />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-semibold truncate"
                style={{ color: "var(--color-fg-default)" }}
              >
                Install Riddle Rush
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--color-fg-muted)" }}
              >
                Add to home screen for the full experience
              </p>
            </div>

            {/* Install button */}
            <button
              onClick={handleInstall}
              className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
              style={{
                background: "var(--color-accent-primary)",
                color: "#FFFFFF",
              }}
            >
              Install
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
