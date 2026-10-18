# UNO-WEB3

A comprehensive implementation of the classic **UNO** card game built for the **WEB3** university course.

---

## Progress Dashboard

| Milestone | Deliverable | Status | Tests | Documentation |
| :--- | :--- | :---: | :---: | :--- |
| **Assignment 1** | Object-Oriented Domain Model & Rules | Completed | **238 / 238 Passing** (100%) | [Assignment Prompt](./assignments/assignment-1/ASSIGNMENT.md) • [Implementation Summary](./assignments/assignment-1/SUMMARY.md) |
| **Assignment 2** | Backend API & Service Layer | ⏳ Pending | — | [Assignment 2](./assignments/assignment-2/README.md) |
| **Assignment 3** | Frontend Web Application | ⏳ Pending | — | [Assignment 3](./assignments/assignment-3/README.md) |
| **Assignment 4** | Advanced Features / Integration | ⏳ Pending | — | [Assignment 4](./assignments/assignment-4/README.md) |
| **Assignment 5** | Persistence / Full-Stack Integration | ⏳ Pending | — | [Assignment 5](./assignments/assignment-5/README.md) |
| **Assignment 6** | Deployment & Final Deliverable | ⏳ Pending | — | [Assignment 6](./assignments/assignment-6/README.md) |

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
│   ├── assignment-2/               # Assignment 2 workspace
│   ├── assignment-3/               # Assignment 3 workspace
│   ├── assignment-4/               # Assignment 4 workspace
│   ├── assignment-5/               # Assignment 5 workspace
│   └── assignment-6/               # Assignment 6 workspace
├── src/
│   ├── model/                      # Assignment 1 Domain Engine
│   │   ├── deck.ts                 # Card types, UnoDeck, initial 108-card deck & mementos
│   │   ├── round.ts                # UnoRound, legal plays, action resolution, UNO shout rules
│   │   └── uno.ts                  # UnoGame multi-round progression, 500-pt scoring
│   └── utils/
│       └── random_utils.ts         # Randomizer & Fisher-Yates Shuffler interfaces
├── __test__/                       # BDD Test Suite (Jest)
│   ├── model/                      # 8 test suites (deck, round, uno, mementos)
│   └── utils/                      # Test adapters and deterministic shuffle builders
├── uno_rules.md                    # Official UNO rules reference
├── package.json
└── tsconfig.json
```

---

## Getting Started

### Installation
```bash
npm install
```

### Running the Test Suite
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

## Assignment 1 Highlights
- **Strictly Typed:** Discriminated unions for Cards (`NumberedCard`, `ColouredCard`, `WildCard`, `WildDrawCard`).
- **Complete Ruleset:** Standard UNO rules plus official 2-player special rules (`Reverse` as `Skip`, `Draw 2` giving another turn).
- **"UNO!" Declaration Window:** Accurate timing window and 4-card draw penalty for uncalled penultimate plays.
- **State Preservation:** Full Memento pattern for saving and restoring `Deck`, `Round`, and `Game` state to/from JSON.
