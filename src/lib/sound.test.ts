import { describe, it, expect, vi, beforeEach } from "vitest";
import { sounds } from "./sound";

describe("sound module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("exports", () => {
    it("exports all 7 expected sound effect names", () => {
      const expected = [
        "diceRoll",
        "correct",
        "incorrect",
        "forcedRiddle",
        "victory",
        "turnAdvance",
        "chime",
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

  describe("sound.play() — error resilience", () => {
    it("diceRoll play does not throw", () => {
      expect(() => sounds.diceRoll.play()).not.toThrow();
    });

    it("correct play does not throw", () => {
      expect(() => sounds.correct.play()).not.toThrow();
    });

    it("incorrect play does not throw", () => {
      expect(() => sounds.incorrect.play()).not.toThrow();
    });

    it("forcedRiddle play does not throw", () => {
      expect(() => sounds.forcedRiddle.play()).not.toThrow();
    });

    it("victory play does not throw", () => {
      expect(() => sounds.victory.play()).not.toThrow();
    });

    it("turnAdvance play does not throw", () => {
      expect(() => sounds.turnAdvance.play()).not.toThrow();
    });

    it("chime play does not throw", () => {
      expect(() => sounds.chime.play()).not.toThrow();
    });
  });
});
