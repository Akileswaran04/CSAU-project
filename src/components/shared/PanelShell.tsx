import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface PanelShellProps {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
  variant?: "default" | "tinted" | "elevated" | "solid";
}

export function PanelShell({
  children,
  className = "",
  title,
  action,
  variant = "default",
}: PanelShellProps) {
  const variantClasses = {
    default: "glass-panel",
    tinted: "glass-panel-tinted",
    elevated:
      "bg-bg-elevated/80 backdrop-blur-glass border border-glass-border rounded-2xl shadow-glass",
    solid:
      "bg-bg-surface border border-white/[0.08] rounded-2xl shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_8px_24px_-12px_rgba(0,0,0,0.5)]",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 24, stiffness: 300 }}
      className={`${variantClasses[variant]} ${className}`}
      style={
        variant === "solid" && title
          ? { borderLeft: "2px solid var(--color-accent-primary)" }
          : undefined
      }
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
          {title && (
            <h3 className="text-lg font-display font-semibold" style={{ color: "var(--color-fg-default)" }}>
              {title}
            </h3>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </motion.div>
  );
}
