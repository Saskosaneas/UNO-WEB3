# Assignment 1: Implementation Summary & Architecture

## Overview
This document summarizes the object-oriented domain model implemented for Assignment 1 of the **WEB3** course. The implementation covers all **Must have**, **Should have**, and **Could have** requirements, achieving 100% test pass rate across the full BDD test suite (238 / 238 tests passing).

---

## Architecture & Class Design

### 1. Card & Deck System (`src/model/deck.ts`)
- **Card Types & Discriminated Unions:**
  - `Color`: `'RED' | 'BLUE' | 'GREEN' | 'YELLOW'`
  - `Type`: `'NUMBERED' | 'SKIP' | 'REVERSE' | 'DRAW' | 'WILD' | 'WILD DRAW'`
  - Discriminated union `Card = ColouredCard | WildCards` guarantees that colored cards always possess a `color`, numbered cards contain a valid `number` ($0 - 9$), and wild cards do not possess inherent colors until declared during play.
  - Generic utility type `TypedCard<T extends Type>` allows extracting specialized card structures.
- **Deck Interface & `UnoDeck` Class:**
  - `deal()`: Pops the top card (`shift`).
  - `peek()`: Inspects the top card without removing it.
  - `shuffle(shuffler)`: Shuffles cards using standard Fisher-Yates or injected test shufflers.
  - `filter(predicate)`: Returns a new Deck matching the predicate.
  - `toMemento()` / `createDeckFromMemento()`: Serializes and deserializes decks with strict schema validation.
  - `createInitialDeck()`: Constructs the official 108-card UNO deck:
    - 1 zero per color (4 cards)
    - 2 of each number 1–9 per color (72 cards)
    - 2 Skips, 2 Reverses, 2 Draw Twos per color (24 action cards)
    - 4 Wild cards and 4 Wild Draw Four cards (8 cards)

---

### 2. Round Model & Game Mechanics (`src/model/round.ts`)
- **`Round` Interface & `UnoRound` Class:**
  - **Setup:** Validates 2–10 players, deals 7 cards per player, reveals starter card, and reshuffles starter pile if a Wild card is initially drawn.
  - **Starting Card Actions:** Immediately resolves starter card actions (`REVERSE` sets counter-clockwise, `SKIP` jumps player, `DRAW` forces first player to draw 2 and skip turn).
  - **Discard Pile Indexing:** Top card is maintained at index `0` for consistent memento inspection (`round.discardPile().top() === memento.discardPile[0]`).
  - **Draw Pile Replenishment:** When the draw pile runs empty during play, the top discard card is retained while all other discard cards are shuffled to reconstitute the draw pile.
  - **Special 2-Player UNO Rules:**
    - `REVERSE` acts as a `SKIP`, granting the current player an immediate second turn.
    - `DRAW` / `WILD DRAW` forces the opponent to draw and grants the player an immediate second turn.
  - **"UNO!" Declaration & Penalty:**
    - `sayUno(playerIndex)`: Records declaration during a player's turn or before an accusation.
    - `catchUnoFailure({ accuser, accused })`: Accuses a player who played down to 1 card without calling "UNO!". Awards a 4-card draw penalty. Closes accusation window once the next player plays or draws.
  - **Scoring & End Callbacks:**
    - `hasEnded()`: Checks if any player emptied their hand.
    - `winner()`: Returns index of the winning player.
    - `score()`: Tallies points from opponents' remaining cards ($0-9$ face value, $20$ for actions, $50$ for wilds).
    - `onEnd(callback)`: Observer pattern notifying subscribers when the round finishes.
  - **Round Memento:** Full bidirectional serialization with validation (`createRoundFromMemento`).

---

### 3. Multi-Round Match System (`src/model/uno.ts`)
- **`Game` Interface & `UnoGame` Class:**
  - Coordinates successive rounds until a player reaches the `targetScore` (default 500).
  - Selects the initial dealer randomly using an injectable `Randomizer`.
  - Rotates the dealer clockwise after each round.
  - Listens to round completion events via `round.onEnd`, updates cumulative player scores, and terminates game progression when a player wins.
  - Full bidirectional serialization (`toMemento()` / `createGameFromMemento()`).

---

## Design Patterns Employed

1. **Memento Pattern:**
   - Externalizes internal state of `Deck`, `Round`, and `Game` into plain JSON-serializable objects.
   - Enables saving/restoring game state, network serialization, and state-based testing.
2. **Observer / Callback Pattern:**
   - `round.onEnd(callback)` decouples round outcome handling from match orchestration in `UnoGame`.
3. **Factory Method / Adapter Pattern:**
   - `createRound`, `createRoundFromMemento`, `createGame`, `createGameFromMemento` decouple instantiation from consumer test suites.
4. **Dependency Injection:**
   - `Shuffler<Card>` and `Randomizer` functions are injectable, enabling 100% deterministic testing without relying on unseeded math randomness.

---

## Test Results

```text
Test Suites: 8 passed, 8 total
Tests:       238 passed, 238 total
Snapshots:   0 total
Time:        2.546 s
```

### Breakdown by Suite:
| Test Suite | Tests Passed | Focus Area |
| :--- | :--- | :--- |
| `deck.test.ts` | 28 / 28 | Deck generation, deal, peek, shuffle, filter, memento |
| `round.start.test.ts` | 21 / 21 | Player count, dealing, starter card action resolution |
| `round.legal.plays.test.ts` | 48 / 48 | Color, number, action, and Wild Draw 4 legal play checks |
| `round.playing.test.ts` | 31 / 31 | Card playing, draw pile replenishment, 2-player rules |
| `round.memento.test.ts` | 26 / 26 | Round memento validation and round-trip fidelity |
| `round.going.out.test.ts` | 41 / 41 | "UNO!" shout rules, 4-card penalties, scoring, callbacks |
| `uno.test.ts` | 28 / 28 | Multi-round game progression, cumulative scoring |
| `uno.memento.test.ts` | 15 / 15 | Game memento serialization and restoration |
