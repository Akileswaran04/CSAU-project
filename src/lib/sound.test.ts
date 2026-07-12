import { describe, it, expect, vi, beforeEach } from "vitest";
import { sounds, soundManager, SoundManager } from "./sound";

describe("sound module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("exports", () => {
    it("exports all 11 expected sound effect names", () => {
      const expected = [
        "diceRoll",
        "correct",
        "incorrect",
        "forcedRiddle",
        "victory",
        "turnAdvance",
        "hop",
        "chime",
        "buttonClick",
        "gameStart",
        "gameEnd",
      ];
      expected.forEach((name) => {
        expect(sounds).toHaveProperty(name);
      });
      expect(Object.keys(sounds).length).toBe(expected.length);
    });

    it("each sound effect has a play function", () => {
      for (const key of Object.keys(sounds) as Array<keyof typeof sounds>) {
        expect(sounds[key]).toHaveProperty("play");
        expect(typeof sounds[key].play).toBe("function");
      }
    });
  });

  describe("soundManager", () => {
    it("is a SoundManager instance", () => {
      expect(soundManager).toBeInstanceOf(SoundManager);
    });

    it("starts with default volumes", () => {
      expect(soundManager.sfxVolume).toBe(0.7);
      expect(soundManager.musicVolume).toBe(0.3);
    });

    it("clamps volume to 0-1 range", () => {
      soundManager.sfxVolume = 2;
      expect(soundManager.sfxVolume).toBe(1);
      soundManager.sfxVolume = -1;
      expect(soundManager.sfxVolume).toBe(0);
    });

    it("play() does not throw before init", () => {
      expect(() => soundManager.play("diceRoll")).not.toThrow();
      expect(() => soundManager.play("correct")).not.toThrow();
    });

    it("toggleMusic returns boolean state", () => {
      // Not initialized, so toggleMusic should return false
      // (no music howl to play)
      expect(typeof soundManager.toggleMusic()).toBe("boolean");
    });

    it("destroy cleans up without throwing", () => {
      expect(() => soundManager.destroy()).not.toThrow();
    });
  });
});
