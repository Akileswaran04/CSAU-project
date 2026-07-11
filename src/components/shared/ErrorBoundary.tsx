import { Component, type ErrorInfo, type ReactNode } from "react";
import { RotateCcw, AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches rendering errors in its subtree and shows a graceful fallback
 * instead of unmounting the entire React tree.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("[ErrorBoundary] Caught rendering error:", error.message);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl"
          style={{
            background: "var(--color-glass-jade-03)",
            border: "1px solid rgba(225, 29, 60, 0.15)",
            minHeight: 300,
          }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: "var(--color-accent-danger-muted)",
              border: "1px solid rgba(225, 29, 60, 0.2)",
            }}
          >
            <AlertTriangle size={24} className="text-accent-danger" />
          </div>
          <p className="text-white/50 text-sm font-display text-center max-w-xs">
            The 3D board encountered an error and couldn't render.
          </p>
          <button
            onClick={this.handleRetry}
            className="glass-button flex items-center gap-2 px-5 py-2.5 font-display font-medium text-white/70 hover:text-white"
          >
            <RotateCcw size={16} />
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
