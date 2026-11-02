# UNO-WEB3

A comprehensive implementation of the classic **UNO** card game built for the **WEB3** university course.

---

## Progress Dashboard

| Milestone | Deliverable | Status | Tests | Documentation |
| :--- | :--- | :---: | :---: | :--- |
| **Assignment 1** | Object-Oriented Domain Model & Rules | Completed | **238 / 238 Passing** (100%) | [Assignment Prompt](./assignments/assignment-1/ASSIGNMENT.md) • [Implementation Summary](./assignments/assignment-1/SUMMARY.md) |
| **Assignment 2** | Browser-Only Uno Against Bots (Vue.js & Web Workers) | 🔄 In Progress (Awaiting Assets) | **238 / 238 Passing** + Vite Build | [Assignment Prompt](./assignments/assignment-2/ASSIGNMENT.md) • [Implementation Summary](./assignments/assignment-2/SUMMARY.md) • [Overview](./assignments/assignment-2/README.md) |
| **Assignment 3** | Multiplayer Uno (Vue.js Client & Apollo GraphQL Server) | ⏳ Pending | — | [Assignment Prompt](./assignments/assignment-3/ASSIGNMENT.md) • [Overview](./assignments/assignment-3/README.md) |
| **Assignment 4** | TBD (Upcoming) | ⏳ Pending | — | [Overview](./assignments/assignment-4/README.md) |
| **Assignment 5** | TBD (Upcoming) | ⏳ Pending | — | [Overview](./assignments/assignment-5/README.md) |
| **Assignment 6** | TBD (Upcoming) | ⏳ Pending | — | [Overview](./assignments/assignment-6/README.md) |

> [!NOTE]
> The exact submission state of Assignment 1 is frozen and tagged in Git under tag [`assignment-1`](https://github.com/Saskosaneas/UNO-WEB3/releases/tag/assignment-1).

---

## Project Structure

```text
UNO-WEB3/
├── assignments/
│   ├── assignment-1/               # Assignment 1 prompt & comprehensive technical summary
│   │   ├── ASSIGNMENT.md
│   │   └── SUMMARY.md
│   ├── assignment-2/               # Assignment 2 prompt, technical summary & overview
│   │   ├── ASSIGNMENT.md
│   │   ├── README.md
│   │   └── SUMMARY.md
│   ├── assignment-3/               # Assignment 3 workspace (Multiplayer + GraphQL)
│   ├── assignment-4/               # Assignment 4 workspace
│   ├── assignment-5/               # Assignment 5 workspace
│   └── assignment-6/               # Assignment 6 workspace
├── future assets/                  # Drop-in UI & card image assets (auto-loaded via Vite)
│   ├── cards/                      # 55 card images (red-0..yellow-draw2, wild, wild-draw4, back)
│   ├── ui/                         # 8 UI images (table, logo, avatars, color tokens)
│   └── README.md                   # Exact asset naming specification
├── src/
│   ├── components/                 # Assignment 2 Vue 3 UI Components
│   │   ├── SetupScreen.vue         # Game setup (player name, 1–3 bots, single round / 500-pt match)
│   │   ├── PlayScreen.vue          # Main game board, opponent seats, wild color picker, UNO buttons, log
│   │   ├── ResultScreen.vue        # Between-rounds scoreboard & game-over screen with confetti
│   │   └── UnoCard.vue             # Card component with automatic image asset loading & text fallback
│   ├── composables/
│   │   └── useUnoGame.ts           # Reactive game coordinator, turn loop & Web Worker bot manager
│   ├── workers/
│   │   └── worker.ts               # Web Worker bot brain (postMessage / onmessage)
│   ├── types/
│   │   └── worker_message.ts       # Discriminated union protocol between main thread & bot workers
│   ├── model/                      # Assignment 1 Domain Engine
│   │   ├── deck.ts                 # Card types, UnoDeck, initial 108-card deck & mementos
│   │   ├── round.ts                # UnoRound, legal plays, action resolution, UNO shout rules
│   │   └── uno.ts                  # UnoGame multi-round progression, 500-pt scoring
│   ├── utils/
│   │   ├── assets.ts               # Dynamic asset loader for "future assets/" with fallback support
│   │   └── random_utils.ts         # Randomizer & Fisher-Yates Shuffler interfaces
│   ├── App.vue                     # Root component & screen router
│   ├── main.ts                     # Vue application entry point
│   └── vite-env.d.ts               # Vite & Vue TypeScript declarations
├── __test__/                       # BDD Test Suite (Jest)
│   ├── model/                      # 8 test suites (deck, round, uno, mementos)
│   └── utils/                      # Test adapters and deterministic shuffle builders
├── index.html                      # Browser entry point
├── vite.config.mts                 # Vite configuration (Vue 3 + ES Web Workers)
├── uno_rules.md                    # Official UNO rules reference
├── package.json
└── tsconfig.json
```

> [!TIP]
> **UI Assets**: Image assets placed in [`future assets/`](./future%20assets/) following the naming guide in [`future assets/README.md`](./future%20assets/README.md) are automatically discovered and displayed by the game, falling back cleanly to text/CSS when omitted.

---

## Getting Started

### Installation
```bash
npm install
```

### Running the Browser Game (Assignment 2)
Start the Vite development server:
```bash
npm run dev
```

Build for production or preview the production build:
```bash
npm run build
npm run preview
```

### Running the Test Suite (Assignment 1)
Run all 238 unit tests across the 8 test suites:
```bash
npm test
```

Run specific test suites:
```bash
# Test the Deck system
npx jest __test__/model/deck.test.ts

# Test Round setup & legal plays
npx jest __test__/model/round.start.test.ts __test__/model/round.legal.plays.test.ts

# Test Turn flow & "UNO!" shout penalty mechanics
npx jest __test__/model/round.playing.test.ts __test__/model/round.going.out.test.ts

# Test Memento state serialization
npx jest __test__/model/round.memento.test.ts __test__/model/uno.memento.test.ts

# Test Full Multi-round Game
npx jest __test__/model/uno.test.ts
```

### Type Checking
```bash
npx tsc --noEmit
```

---

## Milestone Highlights

### Assignment 2 Highlights (Browser UI & Web Worker Bots)
- **Vue 3 Composition API:** Consistent `<script setup lang="ts">` architecture with dependency injection (`provide` / `inject`) via [`useUnoGame.ts`](./src/composables/useUnoGame.ts).
- **Isolated Web Worker Bots:** 1–3 bot opponents run in separate background threads ([`worker.ts`](./src/workers/worker.ts)), communicating strictly via typed `postMessage` and `onmessage` payloads ([`worker_message.ts`](./src/types/worker_message.ts)).
- **Human-like Bot Behavior:** Bots play legally according to Assignment 1 rules, choose optimal Wild colors based on their hand, occasionally forget to shout "UNO!", and probabilistically catch other players who forget to shout "UNO!".
- **Single Round & Full Match Support:** Supports both single-round games and full 500-point multi-round matches with a between-rounds scoreboard and end-of-game celebration.
- **Zero-Config Asset Loader:** Automatically loads `.png`, `.jpg`, or `.jpeg` card and UI graphics from [`future assets/`](./future%20assets/) while providing accessible text fallbacks for any missing files.

### Assignment 1 Highlights (Domain Model)
- **Strictly Typed:** Discriminated unions for Cards (`NumberedCard`, `ColouredCard`, `WildCard`, `WildDrawCard`).
- **Complete Ruleset:** Standard UNO rules plus official 2-player special rules (`Reverse` as `Skip`, `Draw 2` giving another turn).
- **"UNO!" Declaration Window:** Accurate timing window and 4-card draw penalty for uncalled penultimate plays.
- **State Preservation:** Full Memento pattern for saving and restoring `Deck`, `Round`, and `Game` state to/from JSON.
