import "@testing-library/jest-dom";

/**
 * Mock AudioContext for testing in jsdom (which has no real AudioContext).
 * Each test file that imports sound.ts will get this mock.
 */
class MockAudioContext {
  state = "running";
  currentTime = 0;
  destination: null = null;

  createOscillator() {
    return {
      type: "sine",
      frequency: { setValueAtTime: () => {} },
      connect: () => this.createGain(),
      start: () => {},
      stop: () => {},
    };
  }

  createGain() {
    return {
      gain: {
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
      },
      connect: () => {},
    };
  }

  resume() {
    this.state = "running";
  }

  close() {}
}

// Instead of using Object.defineProperty (which eslint may flag with noUnusedLocals),
// just assign the global directly through the test-global window
if (typeof AudioContext === "undefined") {
  // @ts-expect-error - we're providing AudioContext for jsdom
  globalThis.AudioContext = MockAudioContext;
}
