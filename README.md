# UNO-WEB3

A decentralized, on-chain implementation of the classic **UNO** card game built for a Web3 course assignment.

---

## Project Overview

**UNO-WEB3** brings the beloved family card game onto the blockchain. The project explores implementing UNO game logic, smart contract architecture, verifiable state transitions, and a Web3 dApp interface.

* **Fair & Verifiable Play:** Transparent rules and verifiable mechanics without reliance on a centralized server.
* **Trustless State Enforcement:** Smart contracts validate player moves, handle special card effects (Skip, Reverse, Draw 2, Wild, Wild Draw 4), track scores, and enforce game completion.
* **Transparent Game History:** Game events emitted on-chain for auditing and history tracking.

---

## Game Rules Reference

The core logic adheres to the official UNO rules detailed in [`uno_rules.md`](./uno_rules.md):

* **Deck Composition:** 112 Cards (76 Numbered 0–9 across 4 colors, 24 Action Cards [Skip, Reverse, Draw 2], 8 Wild Cards [Wild, Wild Draw 4], and customizable blank cards).
* **Hand Size & Setup:** Each player starts with 7 cards; 1 starter card initiates the discard pile.
* **Turn Flow:** Play matching color, number, or symbol. Draw from pile if no legal play is held or if choosing to renege.
* **Special Actions:**
  * **Skip:** Bypasses next player's turn.
  * **Reverse:** Switches play direction (acts as Skip in 2-player games).
  * **Draw 2 / Wild Draw 4:** Forces victim to draw cards and forfeit their turn.
  * **Wild Draw 4 Challenge:** Mechanics for calling out illegal Wild Draw 4 plays.
  * **UNO Call:** Penalties for failing to declare "UNO!" with 1 card remaining.
* **Scoring & End Condition:** First player to empty their hand wins the round, tallying points based on opponent cards held (first to 500 points wins match, or elimination variation).

---

## Repository Structure

```text
UNO-WEB3/
├── Assignments Documentation/    # Course deliverables, assignment prompts & reports
├── uno_rules.md                 # Complete official UNO rules & reference guide
├── contracts/                   # Smart contracts
├── test/                        # Contract tests & simulation suites
├── frontend/                    # Web3 dApp interface
└── README.md                    # Project documentation
```

---

## Roadmap & Milestones

- [x] Repository initialization and UNO rules consolidation.
- [ ] Assignment requirements review and workspace environment setup.
- [ ] Smart contract architecture design (Deck representation, game state, turn mechanics).
- [ ] Core contract implementation (Deal, Play, Draw, Action resolution, Win conditions).
- [ ] Automated contract testing suite (unit tests, edge cases).
- [ ] Frontend dApp & Web3 wallet connection.
- [ ] Local testnet / Testnet deployment and verification.
- [ ] Final assignment documentation and demonstration submission.

---

## Contributors

* Web3 Course Student & Developer Team

---

## License

This project is created for educational purposes as part of a Web3 curriculum.
