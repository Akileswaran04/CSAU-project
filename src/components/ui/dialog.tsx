/**
 * Dialog — shadcn-style wrapper around @radix-ui/react-dialog
 *
 * Designed with the Ancient Forge token system:
 * - Glass panel surfaces with jade/gold accent borders
 * - Ink-dark backgrounds that blur the scene behind
 *
 * Focus trap, Esc-to-close, and ARIA roles from Radix are inherited for free.
 * CSS transitions provide smooth entry/exit animations.
 */
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const overlayStyles =
  "fixed inset-0 z-50 bg-black/70 backdrop-blur-sm " +
  "data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out";

const contentBaseStyles =
  "fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 " +
  "data-[state=open]:animate-dialog-in data-[state=closed]:animate-dialog-out";

interface DialogOverlayProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> {}

function DialogOverlay({ className = "", ...props }: DialogOverlayProps) {
  return (
    <DialogPrimitive.Overlay
      className={`${overlayStyles} ${className}`}
      {...props}
    />
  );
}

interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  size?: "sm" | "md" | "lg" | "xl";
  /** Prevent dialog from closing on Escape key press */
  preventEscape?: boolean;
  /** Prevent dialog from closing when interacting outside */
  preventOutsideInteraction?: boolean;
}

const sizeMap = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

function DialogContent({
  className = "",
  children,
  size = "md",
  preventEscape = false,
  preventOutsideInteraction = false,
  ...props
}: DialogContentProps) {
  // Lock body scroll when dialog is open
  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={`${contentBaseStyles} ${sizeMap[size]} ${className}`}
        style={{
          background: "var(--color-bg-elevated)",
          border: "1px solid var(--color-glass-border)",
          borderRadius: "var(--radius-2xl)",
          boxShadow: "var(--shadow-ink-heavy), var(--shadow-jade-subtle)",
        }}
        onEscapeKeyDown={(e) => {
          if (preventEscape) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (preventOutsideInteraction) e.preventDefault();
        }}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 p-2 text-white/40 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors">
          <X size={18} />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex items-center justify-between px-6 py-5 border-b border-white/[0.04] ${className}`}
      {...props}
    />
  );
}

function DialogTitle({
  className = "",
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={`text-xl font-display font-bold text-white ${className}`}
      {...props}
    />
  );
}

function DialogDescription({
  className = "",
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={`text-sm text-white/60 ${className}`}
      {...props}
    />
  );
}

function DialogBody({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-6 ${className}`} {...props} />;
}

function DialogFooter({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.04] ${className}`}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogBody,
};
