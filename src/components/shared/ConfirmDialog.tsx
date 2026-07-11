import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogClose,
} from "../ui/dialog";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "warning" | "default";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  variant = "danger",
}: ConfirmDialogProps) {
  const confirmStyles = {
    danger:
      "bg-danger hover:bg-danger text-white glow-danger",
    warning:
      "bg-gold hover:bg-yellow-400 text-bg-base shadow-glow-gold",
    default:
      "bg-jade hover:bg-jade text-white glow-jade",
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p className="text-white/60 mb-2 leading-relaxed">{message}</p>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <button className="glass-button px-5 py-2.5 text-white/60 hover:text-white hover:bg-white/[0.06] font-medium">
              Cancel
            </button>
          </DialogClose>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`glass-button px-5 py-2.5 font-semibold transition-all ${confirmStyles[variant]}`}
          >
            {confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
