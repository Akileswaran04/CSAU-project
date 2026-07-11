import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?:
    | "easy"
    | "medium"
    | "hard"
    | "default"
    | "success"
    | "error"
    | "warning";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const variantClasses = {
  easy: "bg-lime/[0.12] text-accent-success border-accent-success/20",
  medium: "bg-gold/[0.12] text-accent-gold border-accent-gold/20",
  hard: "bg-danger/[0.12] text-accent-danger border-accent-danger/20",
  default: "bg-white/[0.06] text-white/70 border-white/[0.06]",
  success: "bg-lime/[0.12] text-accent-success border-accent-success/20",
  error: "bg-danger/[0.12] text-accent-danger border-accent-danger/20",
  warning: "bg-gold/[0.12] text-accent-gold border-accent-gold/20",
};

const sizeClasses = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
  lg: "px-4 py-1.5 text-base",
};

export function Badge({
  children,
  variant = "default",
  size = "md",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border backdrop-blur-sm ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </span>
  );
}
