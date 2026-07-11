import gsap from "gsap";
import { useGSAP } from "@gsap/react";

/**
 * GSAP animation presets for Riddle Rush game sequences.
 * Provides timeline-based animations for dice roll, riddle reveal, and score pop.
 */

/**
 * Result badge pop: scales in with elastic spring
 */
export function createResultPopTimeline(
  resultBadgeEl: HTMLElement | null,
  onComplete?: () => void
) {
  if (!resultBadgeEl) return null;

  const tl = gsap.timeline({ onComplete });

  tl.fromTo(
    resultBadgeEl,
    { scale: 0, opacity: 0, y: 20 },
    {
      scale: 1,
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: "elastic.out(1, 0.4)",
    }
  );

  return tl;
}

/**
 * Riddle reveal timeline:
 * 1. Content container fades in + slides up
 * 2. Difficulty badge bounces in from left
 * 3. Timer scales in with a slight rotation
 * 4. Riddle question text fades in
 * 5. Verdict buttons slide up from below
 */
export function createRiddleRevealTimeline(
  containerEl: HTMLElement | null,
  badgeEl: HTMLElement | null,
  timerEl: HTMLElement | null,
  questionEl: HTMLElement | null,
  buttonsEl: HTMLElement | null
) {
  const tl = gsap.timeline();

  if (containerEl) {
    tl.fromTo(
      containerEl,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
    );
  }

  if (badgeEl) {
    tl.fromTo(
      badgeEl,
      { x: -30, opacity: 0, scale: 0.5 },
      { x: 0, opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.7)" },
      "-=0.15"
    );
  }

  if (timerEl) {
    tl.fromTo(
      timerEl,
      { scale: 0, rotation: -180, opacity: 0 },
      { scale: 1, rotation: 0, opacity: 1, duration: 0.5, ease: "elastic.out(1, 0.5)" },
      "-=0.1"
    );
  }

  if (questionEl) {
    tl.fromTo(
      questionEl,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" },
      "-=0.2"
    );
  }

  if (buttonsEl) {
    tl.fromTo(
      buttonsEl,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.4)" },
      "-=0.25"
    );
  }

  return tl;
}

/**
 * Score pop timeline: pulses badge, flies points indicator upward
 */
export function createScorePopTimeline(
  scoreBadgeEl: HTMLElement | null,
  pointsEl: HTMLElement | null,
  onComplete?: () => void
) {
  const tl = gsap.timeline({ onComplete });

  if (scoreBadgeEl) {
    tl.to(scoreBadgeEl, {
      scale: 1.3,
      duration: 0.15,
      ease: "power2.out",
    })
    .to(scoreBadgeEl, {
      scale: 1,
      duration: 0.3,
      ease: "elastic.out(1, 0.3)",
    });
  }

  if (pointsEl) {
    tl.fromTo(
      pointsEl,
      { opacity: 1, y: 0, scale: 1 },
      {
        opacity: 0,
        y: -60,
        scale: 1.5,
        duration: 0.6,
        ease: "power2.out",
      },
      "-=0.4"
    );
  }

  return tl;
}

/**
 * Verdict shake timeline for incorrect answers
 */
export function createVerdictShakeTimeline(element: HTMLElement | null) {
  const tl = gsap.timeline();

  if (element) {
    tl.to(element, { x: -10, duration: 0.05, ease: "power1.inOut" })
      .to(element, { x: 10, duration: 0.05, ease: "power1.inOut" })
      .to(element, { x: -8, duration: 0.05, ease: "power1.inOut" })
      .to(element, { x: 8, duration: 0.05, ease: "power1.inOut" })
      .to(element, { x: -5, duration: 0.05, ease: "power1.inOut" })
      .to(element, { x: 5, duration: 0.05, ease: "power1.inOut" })
      .to(element, { x: 0, duration: 0.1, ease: "power2.out" });
  }

  return tl;
}

/**
 * Forced riddle alert pulse timeline
 */
export function createForcedRiddlePulseTimeline(element: HTMLElement | null) {
  const tl = gsap.timeline({ repeat: 3, repeatDelay: 0.3 });

  if (element) {
    tl.to(element, {
      scale: 1.05,
      borderColor: "#ef4444",
      duration: 0.3,
      ease: "power1.inOut",
    })
    .to(element, {
      scale: 1,
      borderColor: "rgba(239, 68, 68, 0.3)",
      duration: 0.3,
      ease: "power1.inOut",
    });
  }

  return tl;
}

export { useGSAP };
