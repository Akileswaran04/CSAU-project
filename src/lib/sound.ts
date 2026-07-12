/**
 * Riddle Rush — Sound System
 *
 * Uses Howler.js for all audio playback with procedurally generated sounds
 * via OfflineAudioContext → WAV blobs → Howl instances.
 *
 * Architecture:
 *   SoundManager (class)
 *     ├── sfxVolume  (0-1, persisted via useSettingsStore)
 *     ├── musicVolume (0-1, persisted via useSettingsStore)
 *     ├── music      (Howl – looping background track)
 *     ├── sfx        { [name]: Howl } – all sound effects
 *     └── play(name) → plays that effect at current sfxVolume
 */

import { Howl } from "howler";

/* ─── Types ─── */
export type SoundName =
  | "diceRoll"
  | "correct"
  | "incorrect"
  | "forcedRiddle"
  | "victory"
  | "turnAdvance"
  | "hop"
  | "chime"
  | "buttonClick"
  | "gameStart"
  | "gameEnd";

/* ─── Procedural audio generation ─── */

/**
 * Render a procedural audio buffer using OfflineAudioContext.
 * Returns a Promise<AudioBuffer>.
 */
async function renderBuffer(
  durationSec: number,
  sampleRate: number,
  build: (ctx: OfflineAudioContext, masterGain: GainNode) => void,
): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(1, sampleRate * durationSec, sampleRate);
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.35;
  masterGain.connect(ctx.destination);
  build(ctx, masterGain);
  return ctx.startRendering();
}

/**
 * Convert an AudioBuffer to a WAV Blob that can be fed to Howler.js.
 */
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;
  const data = buffer.getChannelData(0);

  // 16-bit PCM WAV
  const byteRate = sampleRate * numChannels * 2;
  const blockAlign = numChannels * 2;
  const dataSize = length * numChannels * 2;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, totalSize - 8, true);
  writeString(view, 8, "WAVE");

  // fmt chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true);  // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample

  // data chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < length; i++) {
    const sample = Math.max(-1, Math.min(1, data[i]));
    const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    view.setInt16(offset, int16, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/* ─── Sound definitions ─── */

interface SoundDef {
  duration: number;
  sampleRate?: number;
  build: (ctx: OfflineAudioContext, out: GainNode) => void;
}

const SOUND_DEFS: Record<SoundName, SoundDef> = {
  diceRoll: {
    duration: 0.5,
    sampleRate: 44100,
    build: (ctx, out) => {
      for (let i = 0; i < 6; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = i * 0.05 + Math.random() * 0.05;
        osc.type = "square";
        osc.frequency.value = 150 + Math.random() * 500;
        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08);
        osc.connect(gain).connect(out);
        osc.start(startTime);
        osc.stop(startTime + 0.1);
      }
    },
  },
  correct: {
    duration: 0.6,
    build: (ctx, out) => {
      const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = i * 0.15;
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(gain).connect(out);
        osc.start(t);
        osc.stop(t + 0.35);
      });
    },
  },
  incorrect: {
    duration: 0.6,
    build: (ctx, out) => {
      [300, 200].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = i * 0.2;
        osc.type = "sawtooth";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.connect(gain).connect(out);
        osc.start(t);
        osc.stop(t + 0.4);
      });
    },
  },
  forcedRiddle: {
    duration: 1.2,
    build: (ctx, out) => {
      for (let i = 0; i < 6; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = i * 0.18;
        osc.type = "square";
        osc.frequency.value = 440 + i * 80;
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(gain).connect(out);
        osc.start(t);
        osc.stop(t + 0.15);

        // Add a second harmonic for urgency
        if (i % 2 === 0) {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = "sawtooth";
          osc2.frequency.value = 880 + i * 160;
          gain2.gain.setValueAtTime(0.08, t);
          gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
          osc2.connect(gain2).connect(out);
          osc2.start(t);
          osc2.stop(t + 0.12);
        }
      }
    },
  },
  victory: {
    duration: 1.2,
    build: (ctx, out) => {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = i * 0.25;
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        osc.connect(gain).connect(out);
        osc.start(t);
        osc.stop(t + 0.55);
      });
    },
  },
  turnAdvance: {
    duration: 0.2,
    build: (ctx, out) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.25, 0);
      gain.gain.exponentialRampToValueAtTime(0.001, 0.15);
      osc.connect(gain).connect(out);
      osc.start(0);
      osc.stop(0.18);
    },
  },
  hop: {
    duration: 0.1,
    build: (ctx, out) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 1200;
      gain.gain.setValueAtTime(0.2, 0);
      gain.gain.exponentialRampToValueAtTime(0.001, 0.07);
      osc.connect(gain).connect(out);
      osc.start(0);
      osc.stop(0.08);

      // Second harmonic
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.value = 1800;
      gain2.gain.setValueAtTime(0.1, 0.005);
      gain2.gain.exponentialRampToValueAtTime(0.001, 0.06);
      osc2.connect(gain2).connect(out);
      osc2.start(0.005);
      osc2.stop(0.07);
    },
  },
  chime: {
    duration: 1.5,
    build: (ctx, out) => {
      const notes = [
        { freq: 659.25, delay: 0 },  // E5
        { freq: 880, delay: 0.08 },  // A5
        { freq: 1318.5, delay: 0.15 }, // E6
      ];
      notes.forEach(({ freq, delay }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.25, delay);
        gain.gain.exponentialRampToValueAtTime(0.001, delay + 1.2);
        osc.connect(gain).connect(out);
        osc.start(delay);
        osc.stop(delay + 1.3);
      });
    },
  },
  buttonClick: {
    duration: 0.08,
    build: (ctx, out) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 600;
      gain.gain.setValueAtTime(0.12, 0);
      gain.gain.exponentialRampToValueAtTime(0.001, 0.06);
      osc.connect(gain).connect(out);
      osc.start(0);
      osc.stop(0.07);
    },
  },
  gameStart: {
    duration: 0.8,
    build: (ctx, out) => {
      // Ascending three-note start
      [400, 500, 660].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = i * 0.2;
        osc.type = "triangle";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(gain).connect(out);
        osc.start(t);
        osc.stop(t + 0.35);
      });
    },
  },
  gameEnd: {
    duration: 0.8,
    build: (ctx, out) => {
      // Descending two-note end
      [600, 300].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = i * 0.3;
        osc.type = "triangle";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.connect(gain).connect(out);
        osc.start(t);
        osc.stop(t + 0.45);
      });
    },
  },
};

/* ─── Background music generator ─── */

/**
 * Generate a calming ambient loop: a slow chord progression using
 * sine-wave pads with gentle volume modulation (tremolo).
 * Loop is ~8 seconds long so it doesn't get too repetitive.
 */
const MUSIC_DURATION = 8;
const MUSIC_SAMPLE_RATE = 44100;

async function generateMusicBlob(): Promise<Blob> {
  const ctx = new OfflineAudioContext(1, MUSIC_SAMPLE_RATE * MUSIC_DURATION, MUSIC_SAMPLE_RATE);
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.12; // quiet pad in background
  masterGain.connect(ctx.destination);

  // Chord progression: Cmaj7 → Am → Fmaj7 → G
  const chords = [
    [261.63, 329.63, 392.00, 523.25], // Cmaj7
    [220.00, 329.63, 440.00, 523.25], // Am
    [349.23, 440.00, 523.25, 698.46], // Fmaj7
    [392.00, 493.88, 587.33, 783.99], // G
  ];

  const chordDuration = MUSIC_DURATION / chords.length;

  chords.forEach((freqs, chordIdx) => {
    freqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = chordIdx * chordDuration;

      osc.type = "sine";
      osc.frequency.value = freq;

      // Slow fade in/out for smooth transitions
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.08, t + 0.3);
      gain.gain.setValueAtTime(0.08, t + chordDuration - 0.3);
      gain.gain.linearRampToValueAtTime(0, t + chordDuration);

      // Gentle tremolo
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.5; // slow modulation
      lfoGain.gain.value = 0.03;
      lfo.connect(lfoGain).connect(gain.gain);
      lfo.start(t);
      lfo.stop(t + chordDuration);

      osc.connect(gain).connect(masterGain);
      osc.start(t);
      osc.stop(t + chordDuration);
    });
  });

  const buffer = await ctx.startRendering();
  return audioBufferToWavBlob(buffer);
}

/* ─── Sound Manager ─── */

export class SoundManager {
  private howls: Map<SoundName, Howl> = new Map();
  private musicHowl: Howl | null = null;
  private musicPlaying = false;
  private _sfxVolume = 0.7;
  private _musicVolume = 0.3;

  get sfxVolume() {
    return this._sfxVolume;
  }
  set sfxVolume(v: number) {
    this._sfxVolume = Math.max(0, Math.min(1, v));
    this.howls.forEach((howl) => howl.volume(this._sfxVolume));
  }

  get musicVolume() {
    return this._musicVolume;
  }
  set musicVolume(v: number) {
    this._musicVolume = Math.max(0, Math.min(1, v));
    if (this.musicHowl) {
      this.musicHowl.volume(this._musicVolume);
    }
  }

  /** Call once after user interaction to init audio. */
  async init(): Promise<void> {
    const blobPromises = (Object.entries(SOUND_DEFS) as [SoundName, SoundDef][]).map(
      async ([name, def]) => {
        const buffer = await renderBuffer(def.duration, def.sampleRate ?? 22050, def.build);
        const blob = audioBufferToWavBlob(buffer);
        const url = URL.createObjectURL(blob);
        const howl = new Howl({
          src: [url],
          format: ["wav"],
          volume: this._sfxVolume,
          preload: true,
        });
        this.howls.set(name, howl);
      },
    );

    // Generate music
    const musicBlob = await generateMusicBlob();
    const musicUrl = URL.createObjectURL(musicBlob);
    this.musicHowl = new Howl({
      src: [musicUrl],
      format: ["wav"],
      volume: this._musicVolume,
      loop: true,
      preload: true,
    });

    await Promise.all(blobPromises);
  }

  /** Play a sound effect by name. */
  play(name: SoundName): void {
    const howl = this.howls.get(name);
    if (!howl) return;
    // Reset rate for hop variations
    if (name === "hop") {
      howl.rate(0.8 + Math.random() * 0.4);
    } else {
      howl.rate(1);
    }
    howl.play();
  }

  /** Start background music (idempotent). */
  startMusic(): void {
    if (this.musicPlaying || !this.musicHowl) return;
    this.musicHowl.play();
    this.musicPlaying = true;
  }

  /** Pause background music. */
  stopMusic(): void {
    if (!this.musicHowl || !this.musicPlaying) return;
    this.musicHowl.pause();
    this.musicPlaying = false;
  }

  /** Toggle music on/off. Returns new state. */
  toggleMusic(): boolean {
    if (this.musicPlaying) {
      this.stopMusic();
      return false;
    } else {
      this.startMusic();
      return true;
    }
  }

  /** Clean up all Howl instances and revoke blob URLs. */
  destroy(): void {
    this.howls.forEach((howl) => howl.unload());
    this.howls.clear();
    if (this.musicHowl) {
      this.musicHowl.unload();
      this.musicHowl = null;
    }
    this.musicPlaying = false;
  }
}

/* ─── Singleton instance ─── */

/** Global SoundManager instance – initialize once after user gesture. */
export const soundManager = new SoundManager();

/* ─── Legacy `sounds` API (backward compat) ─── */

type LegacySound = { play: (pitchOffset?: number) => void };

function createLegacySound(name: SoundName): LegacySound {
  return {
    play: (_pitchOffset?: number) => {
      soundManager.play(name);
      // _pitchOffset is accepted for backward compat with hop()
      // but SoundManager handles variation internally with random rate
    },
  };
}

/**
 * Backward-compatible `sounds` object so existing game code
 * (useDiceRoll, RiddleModal, GameControlBar, etc.) keeps working.
 *
 * In the future, migrate those callers to `soundManager.play(name)` directly.
 */
export const sounds: Record<string, LegacySound> = {
  diceRoll: createLegacySound("diceRoll"),
  correct: createLegacySound("correct"),
  incorrect: createLegacySound("incorrect"),
  forcedRiddle: createLegacySound("forcedRiddle"),
  victory: createLegacySound("victory"),
  turnAdvance: createLegacySound("turnAdvance"),
  hop: createLegacySound("hop"),
  chime: createLegacySound("chime"),
  buttonClick: createLegacySound("buttonClick"),
  gameStart: createLegacySound("gameStart"),
  gameEnd: createLegacySound("gameEnd"),
};

/* ─── Deferred init (safe for all browsers) ─── */

// Instead of initializing at module load time, we wait for the first
// user interaction (click / keydown / touch). This avoids autoplay
// policy issues in Brave, Chrome, and Safari, where AudioContext
// creation is blocked without a user gesture.
//
// Howler.js internally creates an AudioContext on first play(), so by
// deferring the Howl instance creation until after a user gesture,
// we ensure the audio subsystem works cross-browser.

let initialized = false;
let initPromise: Promise<void> | null = null;

function onFirstInteraction() {
  if (initialized || initPromise) return;
  initPromise = (async () => {
    try {
      await soundManager.init();
      initialized = true;
      console.log("[audio] Sound manager initialized");
    } catch (err) {
      console.warn("[audio] Failed to initialize sound manager:", err);
    }
  })();

  // Clean up listeners after first interaction
  document.removeEventListener("click", onFirstInteraction);
  document.removeEventListener("keydown", onFirstInteraction);
  document.removeEventListener("touchstart", onFirstInteraction);
}

document.addEventListener("click", onFirstInteraction, { once: true });
document.addEventListener("keydown", onFirstInteraction, { once: true });
document.addEventListener("touchstart", onFirstInteraction, { once: true });

// Also provide a manual init so callers like SplashScreen can
// opt in eagerly after a gesture.
export async function ensureSoundInit(): Promise<void> {
  if (initialized) return;
  onFirstInteraction();
  await initPromise;
}
