// Sound effects for the game
// Using procedural-like tones since we don't have actual audio files
// In production, replace with real audio assets
//
// AudioContext autoplay workaround:
// Modern browsers block AudioContext creation until user interaction.
// We use a single shared AudioContext created on first user gesture
// (click/keydown) so all sound effects work reliably.

let sharedCtx: AudioContext | null = null;

/**
 * Lazily initializes the shared AudioContext.
 * Call this on the first user interaction to satisfy browser autoplay policy.
 */
function resumeAudio(): AudioContext | null {
  try {
    if (!sharedCtx) {
      sharedCtx = new AudioContext();
    }
    if (sharedCtx.state === "suspended") {
      sharedCtx.resume();
    }
    return sharedCtx;
  } catch {
    return null;
  }
}

/** Initialize audio on the first global click/keyboard interaction */
if (typeof window !== "undefined") {
  const init = () => {
    resumeAudio();
    window.removeEventListener("click", init);
    window.removeEventListener("keydown", init);
  };
  window.addEventListener("click", init);
  window.addEventListener("keydown", init);
}

function createTone(frequency: number, duration: number, type: OscillatorType = "sine") {
  return {
    play: () => {
      try {
        const ctx = resumeAudio();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(frequency, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
      } catch {
        // Audio not available
      }
    },
  };
}

export const sounds = {
  diceRoll: {
    play: () => {
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          const s = createTone(200 + Math.random() * 400, 0.1, "square");
          s.play();
        }, i * 100);
      }
    },
  },
  correct: {
    play: () => {
      [
        { freq: 523, delay: 0 },
        { freq: 659, delay: 0.15 },
        { freq: 784, delay: 0.3 },
      ].forEach(({ freq, delay }) => {
        setTimeout(() => createTone(freq, 0.2, "sine").play(), delay * 1000);
      });
    },
  },
  incorrect: {
    play: () => {
      [
        { freq: 300, delay: 0 },
        { freq: 200, delay: 0.2 },
      ].forEach(({ freq, delay }) => {
        setTimeout(() => createTone(freq, 0.3, "sawtooth").play(), delay * 1000);
      });
    },
  },
  forcedRiddle: {
    play: () => {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          createTone(440 + i * 100, 0.15, "square").play();
        }, i * 200);
      }
    },
  },
  victory: {
    play: () => {
      [
        { freq: 523, delay: 0 },
        { freq: 659, delay: 0.2 },
        { freq: 784, delay: 0.4 },
        { freq: 1047, delay: 0.6 },
      ].forEach(({ freq, delay }) => {
        setTimeout(() => createTone(freq, 0.4, "sine").play(), delay * 1000);
      });
    },
  },
  turnAdvance: {
    play: () => {
      createTone(880, 0.1, "sine").play();
    },
  },
  /**
   * Chime — a warm, resonant tone for splash screen entrance.
   * Two rich sine harmonics with a slow decay for a bell-like shimmer.
   */
  chime: {
    play: () => {
      // Use createTone for all three tones — reuses the shared AudioContext
      setTimeout(() => createTone(659.25, 1.2, "sine").play(), 0);   // E5
      setTimeout(() => createTone(880, 1.0, "sine").play(), 80);     // A5
      setTimeout(() => createTone(1318.5, 0.8, "sine").play(), 150); // E6
    },
  },
};
