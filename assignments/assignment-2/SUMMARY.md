# Assignment 2: Implementation Summary & Architecture

## Overview
This document summarizes the browser-based **UNO** user interface and **Web Worker** bot architecture implemented for Assignment 2 of the **WEB3** course. The implementation covers all **Must have**, **Should have**, and **Could have** functional requirements using **Vue.js 3 (Composition API)**, **TypeScript**, and **Vite**, while preserving 100% pass rate on the Assignment 1 test suite (238 / 238 tests passing).

*Current Status: In Progress — Functional code and UI components are complete; awaiting visual card and UI image files in `future assets/`.*

---

## Architecture & Component Design

### 1. Typed Web Worker Message Protocol (`src/types/worker_message.ts`)
- **Strict Thread Isolation:** Bots execute in dedicated background OS threads with no shared memory, DOM, or Vue access, communicating exclusively via `postMessage` and `onmessage` so they can be migrated to a server in Assignment 3.
- **`MainToWorkerMessage` Discriminated Union:**
  - `INIT`: Configures the bot with its `playerIndex`, `name`, `unoSayProbability`, and `unoCatchProbability`.
  - `YOUR_TURN`: Sends the bot's current `hand`, `topCard`, `currentColor`, `drawPileCount`, opponent card counts (`playersCardCounts`), and any `vulnerablePlayerIndex`.
  - `OPPONENT_ACTION`: Notifies bots when another player finishes an action and indicates whether that player is vulnerable to an uncalled "UNO!" penalty (`vulnerableToUnoPenalty`).
- **`WorkerToMainMessage` Discriminated Union:**
  - `READY`: Handshake confirming worker initialization.
  - `PLAY_CARD`: Specifies `playerIndex`, `cardIndex`, optional `declaredColor` (for Wild cards), and `saidUno`.
  - `DRAW_CARD`: Requests drawing a card when no legal move is available.
  - `CATCH_UNO`: Accuses a vulnerable player (`accuserIndex`, `accusedIndex`) to trigger the 4-card draw penalty.

---

### 2. Bot Decision Engine (`src/workers/worker.ts`)
- **Rule-Compliant Move Validation (`isCardPlayable`):**
  - Enforces official Assignment 1 UNO rules: matching active color, matching number, matching action symbol (`SKIP`, `REVERSE`, `DRAW`), unrestricted `WILD`, and `WILD DRAW` legal only when the bot holds no cards matching `currentColor`.
- **Tactical Heuristics (`decideMove` & `chooseBestColor`):**
  - Prioritizes playing colored/numbered/action cards before expending `WILD` or `WILD DRAW` cards.
  - When playing a Wild card, counts the remaining colors in hand and declares the majority color.
- **Probabilistic Human-like Flaws (*Should Have*):**
  - **Forgetting "UNO!":** When playing down from 2 cards to 1 card, rolls `Math.random() < unoSayProbability` (82%–94% per bot) to decide whether to declare "UNO!".
  - **Catching Opponents:** When notified that another player has 1 card without calling "UNO!", rolls `Math.random() < unoCatchProbability` (55%–80% per bot) after a reaction delay to issue a `CATCH_UNO` accusation.

---

### 3. Reactive Game Coordinator (`src/composables/useUnoGame.ts`)
- **State Management & Dependency Injection:**
  - Exposes a single composable root state provided via Vue's `provide` / `inject` (`unoGameKey`, `injectUnoGame`).
  - Clones mutable engine arrays (`[...unoRound.playerHand(humanIndex)]`) on every `syncState()` call to guarantee Vue 3 shallow reactivity triggers.
- **Turn Loop & Pacing:**
  - Supports both **Single Round** (`UnoRound`) and **Full Match** (`UnoGame` to 500 points) modes.
  - Paces bot turns (`botStepDelay = 700ms` plus worker thinking delay) and schedules timers carefully (`clearTurnTimer`) so players can read table actions and react to "UNO!" accusation windows.
- **Wild Picker & UNO Accusation Window:**
  - Validates `unoRound.canPlay(cardIndex)` before opening the Wild color picker modal (`pendingWildIndex`) and provides `cancelWildCard()` to prevent stuck states.
  - Synchronizes `vulnerablePlayerIndex` directly from the round engine (`unoRound.vulnerablePlayer`) so both human and bot accusations resolve accurately.

---

### 4. Vue 3 User Interface & Asset System (`src/components/`, `src/utils/assets.ts`)
- **`SetupScreen.vue`:** Configures player name, opponent count (1–3 Web Worker bots), and game length (*Single round* or *First to 500*).
- **`PlayScreen.vue`:** Renders the game table, opponent seats with card counts and UNO badges, draw/discard piles, active color token, Wild color selection dialog, interactive human hand with legal-play highlights, **UNO!** / **Catch UNO!** buttons, and a live game log.
- **`ResultScreen.vue`:** Displays between-rounds standings (`round_over`) and final match results (`game_over`) with `canvas-confetti` celebration.
- **`UnoCard.vue` & `src/utils/assets.ts`:** Uses Vite's `import.meta.glob` to automatically discover `.png`, `.jpg`, and `.jpeg` card and UI images in `future assets/`, falling back to accessible text/CSS rendering for any image not yet added.

---

## Design Patterns Employed

1. **Actor / Message-Passing Pattern (Web Workers):**
   - Each bot is an isolated actor that communicates with the main thread strictly through immutable, serialized messages (`MainToWorkerMessage` / `WorkerToMainMessage`), preparing the bot engine for server deployment in Assignment 3.
2. **Composable & Dependency Injection Pattern (`provide` / `inject`):**
   - Centralizes reactive game state and domain model orchestration inside `useUnoGame`, injected cleanly across `SetupScreen`, `PlayScreen`, and `ResultScreen` without prop drilling.
3. **Adapter / Facade Pattern:**
   - `useUnoGame` acts as a reactive facade over Assignment 1's object-oriented `UnoRound` and `UnoGame` classes, translating imperative domain mutations into reactive Vue `ref` and `computed` bindings.
4. **Graceful Degradation (Asset Fallback):**
   - `assets.ts` and `UnoCard.vue` decouple functional gameplay from graphical assets, allowing images to be dropped into `future assets/` incrementally without code changes.

---

## Requirements & Verification Summary

| Category | Requirement | Implementation | Status |
| :--- | :--- | :--- | :---: |
| **Must have** | Play 1 round against 1–3 players (bots) | `SetupScreen.vue` + `useUnoGame.ts` | ✅ Functional |
| **Must have** | Bots play according to official UNO rules | `isCardPlayable` in `src/workers/worker.ts` | ✅ Functional |
| **Must have** | Bots implemented as Web Workers (`postMessage` / `onmessage`) | `src/workers/worker.ts` + `worker_message.ts` | ✅ Functional |
| **Must have** | Proceed according to Assignment 1 UNO rules | Reuses `src/model/round.ts` & `uno.ts` | ✅ Functional |
| **Must have** | Setup screen & Playing screen in Vue.js | `SetupScreen.vue`, `PlayScreen.vue` | ✅ Functional |
| **Should have** | Bots sometimes forget to say "UNO!" | `unoSayProbability` roll in `worker.ts` | ✅ Functional |
| **Should have** | Bots sometimes catch another player forgetting "UNO!" | `unoCatchProbability` roll in `worker.ts` | ✅ Functional |
| **Should have** | Game over screen indicating result | `ResultScreen.vue` (`game_over` state) | ✅ Functional |
| **Could have** | Full multi-round game with score (to 500 pts) | `match` mode using `UnoGame` | ✅ Functional |
| **Could have** | "Between rounds" screen indicating match state | `ResultScreen.vue` (`round_over` state) | ✅ Functional |
| **Assets** | Card & UI graphic files in `future assets/` | `future assets/cards/` (55) & `ui/` (8) | 🔄 In Progress |

