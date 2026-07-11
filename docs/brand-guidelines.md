# 🏆 Riddle Rush — Brand Identity Guidelines

> **Tagline:** *Outwit the board.*
> **Version:** 1.0 — July 2026

---

## 1. Brand Overview

### 1.1 Brand Essence

Riddle Rush is a premium social board game where teams race across a grid, solving riddles of escalating difficulty to reach the finish line. The brand fuses the **warmth of an ancient forge** with the **intrigue of a detective's study** — riddles are timeless puzzles of wit, forged in fire and tested by intellect.

| Attribute | Manifestation |
|-----------|---------------|
| **Mysterious** | Deep ink backgrounds, subtle atmospheric animation, hidden depths |
| **Premium** | Glass-morphism panels, metallic accents, restrained color palette |
| **Intellectual** | Clean typography, structured layout, riddle-centric gameplay |
| **Warm** | Copper and amber primary tones, inviting glow effects |
| **Confident** | Bold display type, crisp interactions, purposeful whitespace |

### 1.2 Brand Personality

If the brand were a person, it would be:
- A **curious scholar** by lamplight, scribbling notes in leather-bound journals
- A **master smith** at the forge, shaping raw metal into ornate tools
- A **chess grandmaster** making decisive moves with quiet confidence

**Voice characteristics:**
- Confident but not arrogant
- Warm but not casual
- Precise but not cold
- Clever but not obscure

---

## 2. Visual Identity

### 2.1 Logo

The primary logo is the **RR monogram** — two interlocking letters "R" rendered in copper. It evokes both the game initials and the symmetrical structure of a board game grid.

**Logo variants:**
| Variant | Usage |
|---------|-------|
| **Full logotype** | App icon, sidebar, loading screens |
| **RR Mark** | Favicon, navigation, small UI slots |
| **Wordmark** | Headers, marketing materials |

**Clearance:** Minimum 8px padding on all sides. Never crop, stretch, or recolor the logo.

### 2.2 Color Philosophy

The color system is built on a **forge-fire metaphor**:
- **Copper** → The forge fire itself — primary actions, warmth
- **Gold** → The finished ingot — achievement, mastery  
- **Lime** → The acid test — correctness, verification
- **Crimson** → The quench — danger, wrong answers
- **Ink** → The raw darkness before creation — backgrounds

---

## 3. Design Token Architecture

Three-layer token system: **Primitive → Semantic → Component**.

### 3.1 Primitive Tokens

Raw values that never change. These are the pure colors, sizes, and speeds.

```css
/* ── Color Primitives ── */
--copper-50: #FFF0E8;
--copper-100: #FFD4BE;
--copper-200: #FFB894;
--copper-300: #FF9C6A;
--copper-400: #FF7A45;     /* Primary copper */
--copper-500: #E65D2E;
--copper-600: #CC4017;
--copper-700: #A32D0A;
--copper-800: #7A1B00;

--gold-400: #FFB830;       /* Primary gold */
--lime-400: #C6F135;       /* Primary lime */
--crimson-400: #E11D3C;    /* Primary crimson */

--ink-900: #070809;        /* Deepest background */
--ink-800: #0B0D0E;        /* Base background */
--ink-700: #111415;        /* Surface background */
--ink-600: #181C1E;        /* Elevated surface */
--ink-500: #1E2325;        /* Border tones */

/* Glass primitives */
--glass-white-02: rgba(255, 255, 255, 0.02);
--glass-white-04: rgba(255, 255, 255, 0.04);
--glass-white-06: rgba(255, 255, 255, 0.06);
--glass-white-08: rgba(255, 255, 255, 0.08);
--glass-white-10: rgba(255, 255, 255, 0.10);

/* Copper glass primitives */
--glass-copper-03: rgba(255, 122, 69, 0.03);
--glass-copper-04: rgba(255, 122, 69, 0.04);
--glass-copper-08: rgba(255, 122, 69, 0.08);
--glass-copper-10: rgba(255, 122, 69, 0.10);
--glass-copper-15: rgba(255, 122, 69, 0.15);
--glass-copper-20: rgba(255, 122, 69, 0.20);
--glass-copper-25: rgba(255, 122, 69, 0.25);
```

### 3.2 Semantic Tokens

Purpose-aliased tokens. These describe *what* the token is for, not its value.

```css
/* ── Backgrounds ── */
--bg-base: var(--ink-800);
--bg-surface: var(--ink-700);
--bg-elevated: var(--ink-600);

/* ── Accents ── */
--accent-primary: var(--copper-400);
--accent-primary-hover: var(--copper-300);
--accent-success: var(--lime-400);
--accent-danger: var(--crimson-400);
--accent-gold: var(--gold-400);
--accent-silver: #A0AEC0;
--accent-bronze: #CD7F32;

/* ── Foreground ── */
--fg-default: #FFFFFF;
--fg-muted: rgba(255, 255, 255, 0.60);
--fg-subtle: rgba(255, 255, 255, 0.40);
--fg-faint: rgba(255, 255, 255, 0.25);

/* ── Difficulty (game-specific semantics) ── */
--diff-easy: var(--accent-success);
--diff-medium: var(--accent-gold);
--diff-hard: var(--accent-danger);
```

### 3.3 Component Tokens

These are consumed directly by components. They always reference semantic tokens.

```css
/* ── Glass Panel ── */
--glass-panel-bg: var(--glass-white-02);
--glass-panel-border: var(--glass-white-06);
--glass-panel-tinted-bg: var(--glass-copper-03);
--glass-panel-tinted-border: var(--glass-copper-08);
--glass-panel-shadow: 0 8px 40px -8px rgba(0, 0, 0, 0.5);
--glass-panel-tinted-shadow: 0 8px 40px -8px rgba(255, 122, 69, 0.10);

/* ── Glass Button ── */
--glass-button-bg: transparent;
--glass-button-border: var(--glass-white-10);
--glass-button-radius: 12px;
--glass-button-hover-bg: var(--glass-white-04);
--glass-button-active-scale: 0.98;

/* ── Glass Input ── */
--glass-input-bg: var(--glass-white-04);
--glass-input-border: var(--glass-white-08);
--glass-input-focus-border: var(--accent-primary);
--glass-input-radius: 12px;

/* ── Modal ── */
--modal-backdrop: rgba(0, 0, 0, 0.70);
--modal-bg: var(--ink-600);
--modal-border: var(--glass-white-06);
--modal-radius: 16px;
```

---

## 4. Typography

### 4.1 Type Scale

```css
/* Display text */
--text-display-3xl: 3rem;    /* Hero titles */
--text-display-2xl: 2.25rem; /* Page headers */
--text-display-xl: 1.5rem;   /* Section headers */
--text-display-lg: 1.25rem;  /* Card headers */
--text-display-base: 1rem;   /* Small headers */
--text-display-sm: 0.875rem; /* Sub-headers */

/* Body text */
--text-body-lg: 1rem;
--text-body-base: 0.875rem;
--text-body-sm: 0.75rem;

/* Mono text (scores, timers, labels) */
--text-mono-lg: 1rem;
--text-mono-base: 0.875rem;
--text-mono-sm: 0.75rem;
--text-mono-xs: 0.625rem;
```

### 4.2 Typefaces

| Role | Font | Fallback | Weight |
|------|------|----------|--------|
| Display | Clash Display | General Sans, system-ui, sans-serif | 600–700 |
| Body | General Sans | Inter, system-ui, sans-serif | 400–500 |
| Mono | JetBrains Mono | Fira Code, monospace | 400–700 |

### 4.3 Usage Guidelines

- **Display type** is used for: page titles, section headers, team names, badges
- **Body type** is used for: descriptions, paragraph text, form labels
- **Mono type** is used for: scores, timers, cell numbers, timestamps, leaderboard data
- **Never** mix more than these three typefaces in a single view
- **Letter-spacing** should be applied sparingly — only on uppercase badges (0.05em–0.1em)

---

## 5. Spacing & Layout

### 5.1 Spacing Scale

```css
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-3: 0.75rem;
--space-4: 1rem;
--space-5: 1.25rem;
--space-6: 1.5rem;
--space-8: 2rem;
--space-10: 2.5rem;
--space-12: 3rem;
--space-16: 4rem;
```

### 5.2 Layout Principles

- **Sidebar:** Fixed 72px left rail — icons only, labels below
- **Content area:** Full remaining width with max-width containers (max-w-2xl to max-w-4xl)
- **Board layout:** Full flex-1 left panel + fixed 380px right sidebar (lg breakpoint)
- **Grid patterns:** 2-column team grid, 1-column action lists
- **Glass panels:** 16px rounded corners, 20px internal padding
- **Section spacing:** 32px between major sections, 16px between related panels

---

## 6. Component Design Specifications

### 6.1 Glass Panel (`glass-panel`)

```
┌───────────────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │   ← rgba(255,255,255,0.02)
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│              content                  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
└───────────────────────────────────────┘
```

| Property | Default | Tinted | Elevated |
|----------|---------|--------|----------|
| Background | `var(--glass-white-02)` | `var(--glass-copper-03)` | `var(--ink-600)` |
| Backdrop blur | 24px + saturate 160% | 24px + saturate 160% | 24px |
| Border | 1px `var(--glass-white-06)` | 1px `var(--glass-copper-08)` | 1px `var(--glass-white-08)` |
| Radius | 16px | 16px | 16px |
| Inner shadow | 0 1px 0 rgba(255,255,255,0.06) | Same | None |
| Outer shadow | 0 8px 40px -8px rgba(0,0,0,0.5) | 0 8px 40px -8px var(--glass-copper-10) | 0 8px 40px -8px rgba(0,0,0,0.5) |

### 6.2 Glass Button (`glass-button`)

| State | Background | Border | Scale |
|-------|-----------|--------|-------|
| Default | Transparent | 1px rgba(255,255,255,0.10) | 1.0 |
| Hover | rgba(255,255,255,0.04) | Same | 1.0 |
| Active | Transparent | Same | 0.98 |
| Disabled | Transparent | rgba(255,255,255,0.04) | 1.0 |

**Specular sweep:** On hover, a diagonal gradient highlight animates across the button surface (left→right, 0.5s duration).

**Variant colors:**
| Variant | Background (default) | Background (hover) | Border |
|---------|---------------------|-------------------|--------|
| Start | rgba(198,241,53,0.15) | Same +0.05 | rgba(198,241,53,0.25) |
| Copper | rgba(255,122,69,0.20) | Same +0.05 | rgba(255,122,69,0.30) |
| Danger | rgba(225,29,60,0.08) | rgba(225,29,60,0.15) | rgba(225,29,60,0.15) |
| Default | Transparent | rgba(255,255,255,0.04) | rgba(255,255,255,0.10) |

### 6.3 Glass Input (`glass-input`)

| State | Background | Border | Shadow |
|-------|-----------|--------|--------|
| Resting | rgba(255,255,255,0.04) | 1px rgba(255,255,255,0.08) | None |
| Focus | rgba(255,255,255,0.06) | 1px var(--accent-primary) | 0 0 0 3px rgba(255,122,69,0.15) |
| Placeholder | — | — | rgba(255,255,255,0.25) |

### 6.4 Modal

| Property | Value |
|----------|-------|
| Backdrop | rgba(0,0,0,0.70) + backdrop-blur-sm |
| Panel bg | var(--ink-600) with 95% opacity + backdrop-blur-xl |
| Copper tint overlay | rgba(255,122,69,0.02) |
| Gradient border | 135° white(0.12) → white(0.02) → copper(0.10) |
| Radius | 16px |
| Entrance | scale(0.92) + blur(12px) → scale(1) + blur(0) spring |
| Exit | Reverse of entrance |

**Sizes:**
| Size | Max Width |
|------|-----------|
| sm | 24rem |
| md | 32rem |
| lg | 42rem |
| xl | 56rem |

### 6.5 Badge

| Variant | Background | Border | Color |
|---------|-----------|--------|-------|
| Default | rgba(255,122,69,0.12) | 1px rgba(255,122,69,0.25) | #FF7A45 |
| Easy | rgba(198,241,53,0.12) | 1px rgba(198,241,53,0.25) | #C6F135 |
| Medium | rgba(255,184,48,0.12) | 1px rgba(255,184,48,0.25) | #FFB830 |
| Hard | rgba(225,29,60,0.12) | 1px rgba(225,29,60,0.25) | #E11D3C |

### 6.6 Gradient Border (`gradient-border`)

```
135° gradient:
rgba(255,255,255,0.12) → rgba(255,255,255,0.02) at 50% → rgba(255,122,69,0.10)
```

Used on modals, viewport frames, and premium panels to create a subtle edge glow.

### 6.7 Confirm Dialog

A modal variant with two actions: a neutral Cancel button and a colored Confirm button.

| Variant | Confirm BG | Confirm Hover | Confirm Border |
|---------|-----------|---------------|----------------|
| Danger | rgba(225,29,60,1) | rgba(239,68,68,1) | Same |
| Warning | rgba(255,184,48,1) | rgba(251,191,36,1) | Same |
| Default | rgba(255,122,69,1) | rgba(255,154,108,1) | Same |

---

## 7. Animation & Motion

### 7.1 Duration & Easing

```css
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;
--duration-entrance: 400ms;

--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-emphasis: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### 7.2 Component Animations

| Component | Animation | Duration | Easing |
|-----------|-----------|----------|--------|
| Panel entrance | slide-up (y: 12 → 0, opacity: 0 → 1) | 400ms | spring (damping: 24, stiffness: 300) |
| Modal entrance | scale(0.92→1) + blur(12→0) | 400ms | spring (damping: 25, stiffness: 300) |
| List items | slide from left (x: -20 → 0) | 300ms | spring (stiffness: 250) |
| Button hover | specular sweep (0→100%) | 500ms | ease-in-out |
| Button active | scale(1→0.98) | 100ms | ease-smooth |
| Dice tray pulse | shadow oscillation | 3s | ease-in-out infinite |
| Forced alarm | shadow + border pulse | 0.5s | ease-in-out infinite |
| Shimmer | background-position sweep | 3s | ease-in-out infinite |

### 7.3 Reduced Motion

All animations respect `prefers-reduced-motion: reduce`:
- All durations → 0.01ms (immediate)
- All infinite animations → stopped
- Shimmer, specular sweep → hidden

---

## 8. Tone of Voice

### 8.1 Writing Guidelines

| Do | Don't |
|----|-------|
| Use confident, clear language | Use jargon or overly complex words |
| Keep messages concise | Write paragraphs where sentences suffice |
| Use active voice | Use passive voice |
| Be warm but professional | Be overly casual or slangy |
| Use precise game terminology | Be vague about game mechanics |

### 8.2 Examples

- ✅ **"Game started! First turn: Team Phoenix"**
- ✅ **"3 riddles remaining in this round"**
- ✅ **"Time's up — riddle auto-marked as incorrect"**
- ❌ **"Oops, something went wrong lol"**
- ❌ **"The game state has been transitioned to an active phase"**

---

## 9. Logo Usage & Assets

### 9.1 Logo Specifications

| Property | Value |
|----------|-------|
| Aspect ratio | 1:1 |
| Minimum size | 24px |
| Safe zone | 8px padding on all sides |
| Colors | Copper (`#FF7A45`) on dark; White on dark backgrounds |

### 9.2 Logo Do's

- Use the provided logo SVG or React component
- Maintain aspect ratio when resizing
- Use copper (#FF7A45) on dark backgrounds
- Use white (#FFFFFF) on copper backgrounds

### 9.3 Logo Don'ts

- Do not stretch or distort
- Do not apply drop shadows or glow effects
- Do not change the color proportions
- Do not place on low-contrast backgrounds
- Do not rotate or flip

---

## 10. Accessibility

### 10.1 Contrast Ratios

| Token Pair | Ratio | WCAG |
|-----------|-------|------|
| Text on bg-base | 14.5:1 | AAA |
| Muted text on bg-base | 7.2:1 | AAA |
| Subtle text on bg-base | 4.8:1 | AA |
| Copper on bg-base | 7.5:1 | AAA |

### 10.2 Focus States

All interactive elements must show a visible focus ring:
```css
:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
  border-radius: 4px;
}
```

### 10.3 Reduced Motion

All animations respect `prefers-reduced-motion: reduce`. See §7.3.

---

## 11. Dos and Don'ts

| Area | ✅ Do | ❌ Don't |
|------|-------|---------|
| Backgrounds | Use ink-based colors (#070809–#181C1E) | Use pure black (#000) or bright backgrounds |
| Accents | Use copper for primary actions, gold for achievements | Use copper for errors or danger states |
| Typography | Use Clash Display for headers, General Sans for body | Use more than three typefaces in one view |
| Glass panels | Use glass-panel or glass-panel-tinted variants | Add custom backgrounds to panels |
| Animations | Use spring-based entrance animations | Use aggressive bounce animations |
| Data display | Use mono type for scores, timers, leaderboard numbers | Use display type for dense data |

---

## 12. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | July 2026 | Initial brand identity system |

---

*Built with the CL4R1T4S design methodology — 6-step process: Understand → Explore → Plan → Build → Done → Verify*
