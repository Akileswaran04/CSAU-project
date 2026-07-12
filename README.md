# 🎲 Riddle Rush

**A fast-paced multiplayer trivia board game** — roll the dice, solve riddles, and race your team to the finish line.

## 🚀 Live Demo

🔗 **[https://csau.vercel.app/](https://csau.vercel.app/)**

## 📖 About

Riddle Rush is an interactive 3D board game where teams compete to solve riddles and race across a serpentine board. Features both local hot-seat multiplayer and online multiplayer mode.

## ✨ Features

- 🎲 **Dice Rolling** — Physics-based 3D dice with smooth animation
- 🧩 **50+ Riddles** — Multiple-choice questions across tech and wordplay categories, with easy/medium/hard difficulty levels
- 🏆 **Leaderboards** — Live standings during gameplay and all-time history (offline & online)
- 🌐 **Online Multiplayer** — Create rooms and play with friends over WebSocket
- 👀 **Spectator Mode** — Watch live games in real-time with full-screen 3D board view
- 🎮 **Local Hot-Seat** — Play with 2+ teams on the same device
- 🎨 **3D Board** — Immersive serpentine board built with Three.js and React Three Fiber
- ⏱️ **Timed Rounds** — Each riddle has a countdown timer with visual feedback
- 🏅 **Scoring System** — Points and movement bonuses based on difficulty and correctness

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite |
| **3D Rendering** | Three.js, React Three Fiber, Drei |
| **Styling** | Tailwind CSS 4, Framer Motion |
| **State** | Zustand (persisted) |
| **Backend** | Socket.io, Express |
| **Database** | Supabase (optional) |
| **Deployment** | Vercel |

## 🏃 Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Create a `.env.local` file with Supabase credentials (optional — local storage fallback works without it):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
```

### Running the WebSocket Server (for online multiplayer)

```bash
# Install server dependencies
cd server && npm install

# Start server
npm run server

# The game client runs on port 5173, server on port 3001
```

## 📁 Project Structure

```
src/
├── components/    # React components (board, dice, riddles, leaderboard, UI)
├── data/          # Game config and riddle data
├── hooks/         # Custom React hooks (dice, multiplayer, spectator, riddles)
├── lib/           # Utilities (scoring, sound, animations, Supabase client)
├── pages/         # Page components (Hero, Setup, Board, Spectator, Leaderboard)
├── store/         # Zustand state stores (game, riddles, leaderboard, settings)
└── main.tsx       # App entry point
```

## 📄 License

MIT
