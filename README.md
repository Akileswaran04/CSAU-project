<div align="center">

<br />

<img src="https://img.shields.io/badge/status-live-brightgreen?style=flat-square&labelColor=070809&color=C6F135" alt="Status" />
<img src="https://img.shields.io/badge/version-2.0.0-FF7A45?style=flat-square&labelColor=070809&color=FF7A45" alt="Version" />
<img src="https://img.shields.io/badge/license-MIT-FFB830?style=flat-square&labelColor=070809&color=FFB830" alt="License" />
<img src="https://img.shields.io/badge/react-19-4C8DFF?style=flat-square&labelColor=070809&color=4C8DFF" alt="React 19" />

<br />

<!-- ─── Hero ─── -->

```
╔══════════════════════════════════════════════════════╗
║                                                        ║
║     ██████╗ ██╗██████╗ ██████╗ ██╗     ███████╗       ║
║     ██╔══██╗██║██╔══██╗██╔══██╗██║     ██╔════╝       ║
║     ██████╔╝██║██║  ██║██║  ██║██║     █████╗         ║
║     ██╔══██╗██║██║  ██║██║  ██║██║     ██╔══╝         ║
║     ██║  ██║██║██████╔╝██████╔╝███████╗███████╗       ║
║     ╚═╝  ╚═╝╚═╝╚═════╝ ╚═════╝ ╚══════╝╚══════╝       ║
║                                                        ║
║          ██████╗ ██╗   ██╗███████╗██╗  ██╗            ║
║          ██╔══██╗██║   ██║██╔════╝██║  ██║            ║
║          ██████╔╝██║   ██║███████╗███████║            ║
║          ██╔══██╗██║   ██║╚════██║██╔══██║            ║
║          ██║  ██║╚██████╔╝███████║██║  ██║            ║
║          ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝            ║
║                                                        ║
╚══════════════════════════════════════════════════════════╝
```

<br />

# 🔥 Riddle Rush

### *Outwit the board.*

**A fast-paced multiplayer trivia board game** — roll the dice, solve riddles, and race your team across a serpentine 3D board to victory.

<br />

[![Play Now](https://img.shields.io/badge/🚀%20PLAY%20NOW-csau.vercel.app-FF7A45?style=for-the-badge&labelColor=070809)](https://csau.vercel.app/)

<br />

---

</div>

<br />

## ✦ At a Glance

| | Feature | Description |
|---|---|---|
| 🎲 | **Dice** | Physics-based 3D dice with realistic rolling animation |
| 🧩 | **Riddles** | 50+ multiple-choice riddles across tech & wordplay categories |
| 🏆 | **Leaderboards** | Live standings + all-time history (offline & online) |
| 🌐 | **Online MP** | Create rooms, play with friends over Supabase Realtime |
| 👀 | **Spectator** | Watch live games in real-time with full 3D board view |
| 🎮 | **Local** | Hot-seat multiplayer for 2–8 teams on one device |
| 🛡️ | **Reconnect** | Auto-reconnect with countdown timer + manual retry |
| 🎨 | **3D Board** | Immersive serpentine board built with React Three Fiber |

<br />

## ✦ Tech Stack

<div align="center">

| Frontend | 3D & Motion | State | Backend | Database | Deploy |
|---|---|---|---|---|---|
| React 19 · TypeScript · Vite | Three.js · R3F · Drei · Framer Motion | Zustand (persisted) | Socket.io · Express | Supabase (Realtime) | Vercel |

</div>

<br />

## ✦ Live Demo

> ### 🔗 **[https://csau.vercel.app/](https://csau.vercel.app/)**
>
> Jump right in — no account needed. Play local hot-seat or create an online room.

<br />

## ✦ Screenshots

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   [  Hero Page  ]    [  Team Setup  ]    [ 3D Board  ] │
│   ┌──────────┐     ┌──────────┐     ┌──────────┐      │
│   │  ✦ Riddle │     │  Team    │     │ ╱╲╱╲╱╲   │      │
│   │  Rush     │     │  Regis-  │     │ ╲╱╲╱╲╱╲  │      │
│   │  Outwit   │     │  tration │     │   ╱╲╱╲   │      │
│   │  the      │     │  2/8     │     │  Roll!   │      │
│   │  board ↓  │     │  teams   │     │  ⚀⚁⚂    │      │
│   └──────────┘     └──────────┘     └──────────┘      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

<br />

## ✦ Features

### 🎲 Gameplay

| Feature | Detail |
|---------|--------|
| **Dice Rolling** | Physics-based 3D dice with satisfying spring animations |
| **Riddle System** | 56+ hand-crafted riddles across Tech & Wordplay, 3 difficulty levels |
| **Scoring** | Points & cell movement scaling with difficulty — Easy (1), Medium (2), Hard (3) |
| **Timer** | Each riddle has a countdown — answer before time runs out |
| **Forced Riddles** | Land on a forced cell? No choice — solve or lose your turn |
| **End Game** | First team to the finish triggers confetti & final leaderboard |

### 🌐 Online Multiplayer

| Capability | How it works |
|------------|-------------|
| **Rooms** | 6-char room codes, up to 8 players per room |
| **Real-time Sync** | Supabase Realtime broadcasts game state to all players |
| **Presence** | See who's online with live presence tracking |
| **Spectator Mode** | Invisible read-only connection — watch without interfering |
| **Reconnection** | Auto-retry every 10s with countdown timer + manual "Reconnect Now" |
| **Room Persistence** | Game state saved to DB — refresh mid-game and reconnect seamlessly |
| **Leave Game** | Clean exit with room cleanup and navigation back to setup |

### 🎨 Visual & UX

| Feature | Detail |
|---------|--------|
| **3D Board** | Serpentine path rendered with React Three Fiber + Drei |
| **Glassmorphism** | Premium glass-panel UI with copper/amber accents |
| **Animations** | Framer Motion spring physics, stagger effects, layout transitions |
| **Sound** | Spatial audio via Howler.js — dice rolls, correct/wrong, victory chime |
| **Dark Theme** | "Ink" color palette with forge-fire copper/gold accents |
| **PWA** | Installable as a progressive web app with offline fallback |
| **Responsive** | Full desktop experience with mobile-adaptive controls |

<br />

## ✦ Getting Started

```bash
# 1. Clone & install
npm install

# 2. Start dev server
npm run dev

# 3. Build for production
npm run build

# 4. Preview build
npm run preview
```

### 🔐 Environment Variables (optional)

Create `.env.local` for Supabase (local storage fallback works without it):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### 🖥️ WebSocket Server (for online multiplayer)

```bash
cd server && npm install && npm run server
```

> Client runs on `:5173`, server on `:3001`.

<br />

## ✦ Project Structure

```
src/
├── components/        # UI components
│   ├── board/         #   3D board, cells, tokens
│   ├── controls/      #   Action log, game bar
│   ├── dice/          #   3D dice + panel
│   ├── leaderboard/   #   Standings + history
│   ├── riddles/       #   Riddle modal
│   ├── shared/        #   Brand, panels, background
│   └── ui/            #   Button, dialog atoms
├── data/              # Game config, 56 riddles
├── hooks/             # Dice, multiplayer, spectator, riddles
├── lib/               # Scoring, sound, Supabase, animations
├── pages/             # Hero, Setup, Board, Spectator, Leaderboard
├── store/             # Zustand stores (game, riddles, leaderboard)
└── main.tsx           # Entry point
```

<br />

## ✦ Brand & Design

This project follows a **forge-fire** design philosophy — think copper smithing, amber glow, and deep ink darkness. See [Brand Guidelines](./docs/brand-guidelines.md) for the full token system, typography scale, component specs, and animation principles.

| Token | Value | Usage |
|-------|-------|-------|
| `--accent-primary` | `#FF7A45` Copper | Primary actions, links |
| `--accent-success` | `#C6F135` Lime | Correct answers |
| `--accent-gold` | `#FFB830` Gold | Achievements, winners |
| `--accent-danger` | `#E11D3C` Crimson | Wrong answers, errors |
| `--ink-900` | `#070809` | Deepest background |

<br />

## ✦ License

<div align="center">

**MIT** — Free to use, modify, and distribute.

<br />

---

<br />

<p align="center">
  <sub>Built with 🔥 · TypeScript · React 19 · Three.js · Supabase</sub>
</p>

</div>
