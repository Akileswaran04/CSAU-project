import { motion } from "framer-motion";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  id?: string;
}

export function Toggle({ checked, onChange, label, description, id }: ToggleProps) {
  const toggleId = id || `toggle-${label?.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="flex items-center justify-between gap-4">
      {(label || description) && (
        <div className="flex-1">
          {label && (
            <label
              htmlFor={toggleId}
              className="text-sm font-display font-medium cursor-pointer"
              style={{ color: "var(--color-fg-default)" }}
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs mt-0.5" style={{ color: "var(--color-fg-muted)" }}>
              {description}
            </p>
          )}
        </div>
      )}
      <button
        id={toggleId}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative shrink-0 w-11 h-6 rounded-full transition-all duration-200 cursor-pointer"
        style={{
          backgroundColor: checked
            ? "var(--color-accent-primary)"
            : "var(--color-bg-elevated)",
          border: checked
            ? "1px solid var(--color-accent-primary)"
            : "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white shadow-sm"
          style={{
            translateX: checked ? "20px" : "0px",
          }}
        />
      </button>
    </div>
  );
}
