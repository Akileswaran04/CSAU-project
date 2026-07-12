/**
 * Button — Shared button component with design-token-driven variants.
 *
 * Variants:
 *   primary   → filled accent bg, white text, glow shadow (main CTA)
 *   secondary → glass-style with tinted border (default action)
 *   danger    → red tinted bg, danger text (destructive actions)
 *   ghost     → minimal, no border/bg (tertiary/link-like actions)
 *
 * Sizes: sm, md, lg
 */
import type { ReactNode, ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-accent-primary text-white font-semibold shadow-glow hover:brightness-110 active:brightness-90",
  secondary:
    "glass-button text-white/70 hover:text-white font-medium border-glass-border bg-glass-white-04 hover:bg-glass-white-06",
  danger:
    "glass-button text-accent-danger font-medium border-accent-danger-muted bg-accent-danger-muted hover:brightness-110",
  ghost:
    "text-fg-subtle hover:text-fg-default font-medium transition-colors bg-transparent border-none",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2.5 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2.5",
};

export function Button({
  children,
  variant = "secondary",
  size = "md",
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`
        inline-flex items-center justify-center shrink-0
        rounded-xl transition-all duration-200
        font-display
        disabled:opacity-30 disabled:cursor-not-allowed disabled:brightness-100
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
