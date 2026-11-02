# WEB3 Assignment 2: Browser-Only Uno Against Bots

*Status: Completed (Ready for optional graphic assets)*

## Overview
A browser-based **UNO** game built with **Vue.js 3**, **TypeScript**, and **Vite**, played against 1–3 bots implemented as isolated **Web Workers** communicating exclusively via `postMessage` and `onmessage`.

- [Official Assignment Prompt](./ASSIGNMENT.md)
- [Asset Naming & Drop-In Guide](../../future%20assets/README.md)

---

## What Was Built

### 1. Framework & Tooling
- **Vite + Vue 3 (Composition API):** Configured in [`vite.config.mts`](../../vite.config.mts) with ES module Web Worker bundling (`worker: { format: 'es' }`) and `@/` path alias.
- **TypeScript & Test Preservation:** Configured [`tsconfig.json`](../../tsconfig.json) for `DOM` and `WebWorker` environments while keeping all **238 / 238** Jest unit tests from Assignment 1 passing.

### 2. Web Worker Bot Architecture *(Must Have & Should Have)*
- **Typed Message Protocol ([`src/types/worker_message.ts`](../../src/types/worker_message.ts)):**
  - `MainToWorkerMessage`: `INIT`, `YOUR_TURN`, `OPPONENT_ACTION`
  - `WorkerToMainMessage`: `READY`, `PLAY_CARD`, `DRAW_CARD`, `CATCH_UNO`
- **Bot Brain ([`src/workers/worker.ts`](../../src/workers/worker.ts)):**
  - Evaluates legal plays strictly following Assignment 1 rules (including the Wild Draw 4 restriction).
  - Selects the most frequent color in hand when playing Wild cards.
  - **Human-like UNO Flaws:** Bots probabilistically forget to shout "UNO!" when playing down to 1 card (`unoSayProbability`), and probabilistically catch other players who fail to call "UNO!" (`unoCatchProbability`).

### 3. Reactive Game Coordinator ([`src/composables/useUnoGame.ts`](../../src/composables/useUnoGame.ts))
- Spawns and terminates 1–3 Web Worker instances dynamically.
- Connects the Assignment 1 `UnoRound` and `UnoGame` models to Vue reactivity.
- Manages turn pacing, UNO declaration windows, wild color selection prompts, and live game logs.

### 4. Vue Screens & Components ([`src/components/`](../../src/components/))
- **[`SetupScreen.vue`](../../src/components/SetupScreen.vue):** Choose player name, number of bot opponents (1–3), and game mode (*Single round* or *First to 500 points*).
- **[`PlayScreen.vue`](../../src/components/PlayScreen.vue):** Interactive game table featuring opponent seats, draw/discard piles, active color indicator, Wild color picker dialog, interactive player hand, "Say UNO!" and "Catch UNO!" actions, and a live event log.
- **[`ResultScreen.vue`](../../src/components/ResultScreen.vue):** Displays between-rounds standings and the final game-over screen with confetti celebration.
- **[`UnoCard.vue`](../../src/components/UnoCard.vue) & [`src/utils/assets.ts`](../../src/utils/assets.ts):** Automatically loads card and UI images from [`future assets/`](../../future%20assets/) and falls back to clean text/CSS cards when images are not yet present.

---

## Running the Application

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run Assignment 1 unit tests
npm test
```
