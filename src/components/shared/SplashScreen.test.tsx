import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { SplashScreen } from "./SplashScreen";
import { sounds } from "../../lib/sound";

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("../../lib/sound", () => ({
  sounds: {
    chime: { play: vi.fn() },
  },
}));

vi.mock("./BrandLogo", () => ({
  BrandLogo: ({
    variant,
    size,
  }: {
    variant?: string;
    size?: number;
  }) => <div data-testid="brand-logo" data-variant={variant} data-size={size} />,
}));

vi.mock("framer-motion", () => {
  const MotionDiv = ({ children, className, style, ...props }: any) => {
    const extraProps: Record<string, any> = {};
    if (props["data-testid"]) extraProps["data-testid"] = props["data-testid"];
    return (
      <div className={className} style={style} {...extraProps}>
        {children}
      </div>
    );
  };
  const MotionP = ({ children, className, style }: any) => (
    <p className={className} style={style}>
      {children}
    </p>
  );
  const MotionSpan = ({ children, className, style }: any) => (
    <span className={className} style={style}>
      {children}
    </span>
  );
  return {
    motion: {
      div: MotionDiv,
      p: MotionP,
      span: MotionSpan,
    },
  };
});

/** Helper: wait ms in real time */
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Helper: dispatch a click on window inside act */
function clickWindow() {
  act(() => {
    window.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

/** Helper: dispatch a keydown on window inside act */
function keydownWindow() {
  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true }));
  });
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("SplashScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Rendering ──────────────────────────────────────────────────────────

  it("renders the brand logo with 'full' variant", () => {
    render(<SplashScreen onFinish={vi.fn()} />);
    const logo = screen.getByTestId("brand-logo");
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute("data-variant", "full");
  });

  it("renders the tagline 'Outwit the board'", () => {
    render(<SplashScreen onFinish={vi.fn()} />);
    expect(screen.getByText("Outwit the board")).toBeInTheDocument();
  });

  it("renders the version 'v2.0'", () => {
    render(<SplashScreen onFinish={vi.fn()} />);
    expect(screen.getByText("v2.0")).toBeInTheDocument();
  });

  it("renders the 'Tap to continue' hint", () => {
    render(<SplashScreen onFinish={vi.fn()} />);
    expect(screen.getByText("Tap to continue")).toBeInTheDocument();
  });

  // ── Auto-dismiss ───────────────────────────────────────────────────────

  it("calls onFinish after duration + exit animation", async () => {
    const onFinish = vi.fn();
    render(<SplashScreen duration={100} onFinish={onFinish} />);

    // Total wait: 100ms auto-dismiss + 600ms exit animation + buffer
    await wait(1500);

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  // ── Interaction ────────────────────────────────────────────────────────

  it("immediately dismisses on window click", async () => {
    const onFinish = vi.fn();
    render(<SplashScreen duration={5000} onFinish={onFinish} />);

    clickWindow();

    // Wait for 600ms exit animation + buffer
    await wait(1000);

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("immediately dismisses on window keydown", async () => {
    const onFinish = vi.fn();
    render(<SplashScreen duration={5000} onFinish={onFinish} />);

    keydownWindow();

    await wait(1000);

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("plays copper chime on click interaction", () => {
    render(<SplashScreen onFinish={vi.fn()} />);

    clickWindow();

    expect(vi.mocked(sounds.chime.play)).toHaveBeenCalledTimes(1);
  });

  it("plays copper chime on keydown interaction", () => {
    render(<SplashScreen onFinish={vi.fn()} />);

    keydownWindow();

    expect(vi.mocked(sounds.chime.play)).toHaveBeenCalledTimes(1);
  });

  // ── Idempotency ────────────────────────────────────────────────────────

  it("does not call onFinish twice on repeated clicks", async () => {
    const onFinish = vi.fn();
    render(<SplashScreen duration={5000} onFinish={onFinish} />);

    clickWindow();
    clickWindow();

    await wait(1200);

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("only plays copper chime once on first interaction", () => {
    render(<SplashScreen onFinish={vi.fn()} />);

    clickWindow();
    clickWindow();

    expect(vi.mocked(sounds.chime.play)).toHaveBeenCalledTimes(1);
  });
});
