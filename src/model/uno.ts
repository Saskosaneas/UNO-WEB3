import { Card } from "./deck";
import { Round, createRound, createRoundFromMemento } from "./round";
import { Randomizer, Shuffler, standardRandomizer, standardShuffler } from "../utils/random_utils";

export interface Game {
    readonly playerCount: number
    player(index: number): string
    readonly targetScore: number
    score(playerIndex: number): number
    winner(): number | undefined
    currentRound(): Round | undefined
    toMemento(): GameMemento
}

export type GameMemento = {
    players: string[]
    targetScore: number
    scores: number[]
    cardsPerPlayer: number
    currentRound?: any
}

export type GameConfig = {
    players: string[]
    targetScore: number
    randomizer: Randomizer
    shuffler: Shuffler<Card>
    cardsPerPlayer: number
}

export class UnoGame implements Game {
    private players: string[]
    private _targetScore: number
    private scores: number[]
    private cardsPerPlayer: number
    private randomizer: Randomizer
    private shuffler: Shuffler<Card>
    private currentRound_?: Round
    private currentDealer: number = 0

    constructor(
        players: string[] = ['A', 'B'],
        targetScore: number = 500,
        randomizer: Randomizer = standardRandomizer,
        shuffler: Shuffler<Card> = standardShuffler,
        cardsPerPlayer: number = 7
    ) {
        if (players.length < 2) {
            throw new Error("At least 2 players required")
        }
        if (targetScore <= 0) {
            throw new Error("Target score must be greater than 0")
        }
        this.players = [...players]
        this._targetScore = targetScore
        this.randomizer = randomizer
        this.shuffler = shuffler
        this.cardsPerPlayer = cardsPerPlayer
        this.scores = new Array(players.length).fill(0)

        const initialDealer = randomizer(players.length)
        const firstRound = createRound({
            players: this.players,
            dealer: initialDealer,
            shuffler: this.shuffler,
            cardsPerPlayer: this.cardsPerPlayer
        })
        this.setupRound(firstRound, initialDealer)
    }

    private setupRound(round: Round, dealer: number): void {
        this.currentRound_ = round
        this.currentDealer = dealer
        round.onEnd(({ winner }) => {
            const roundScore = round.score() ?? 0
            this.scores[winner] += roundScore
            if (this.scores[winner] >= this._targetScore) {
                this.currentRound_ = undefined
            } else {
                const nextDealer = (this.currentDealer + 1) % this.players.length
                const nextRound = createRound({
                    players: this.players,
                    dealer: nextDealer,
                    shuffler: this.shuffler,
                    cardsPerPlayer: this.cardsPerPlayer
                })
                this.setupRound(nextRound, nextDealer)
            }
        })
    }

    get playerCount(): number {
        return this.players.length
    }

    player(index: number): string {
        if (index < 0 || index >= this.players.length) {
            throw new Error(`Player index ${index} out of bounds`)
        }
        return this.players[index]
    }

    get targetScore(): number {
        return this._targetScore
    }

    score(playerIndex: number): number {
        if (playerIndex < 0 || playerIndex >= this.players.length) {
            throw new Error(`Player index ${playerIndex} out of bounds`)
        }
        return this.scores[playerIndex]
    }

    winner(): number | undefined {
        const idx = this.scores.findIndex(s => s >= this._targetScore)
        return idx === -1 ? undefined : idx
    }

    currentRound(): Round | undefined {
        return this.currentRound_
    }

    toMemento(): GameMemento {
        const res: any = {
            players: [...this.players],
            targetScore: this._targetScore,
            scores: [...this.scores],
            cardsPerPlayer: this.cardsPerPlayer,
        }
        if (this.currentRound_) {
            res.currentRound = this.currentRound_.toMemento()
        }
        return res
    }

    static fromMemento(
        memento: any,
        randomizer: Randomizer = standardRandomizer,
        shuffler: Shuffler<Card> = standardShuffler
    ): UnoGame {
        if (!memento) {
            throw new Error("Memento is required")
        }
        if (!memento.players || !Array.isArray(memento.players) || memento.players.length < 2) {
            throw new Error("At least 2 players required")
        }
        if (typeof memento.targetScore !== 'number' || memento.targetScore <= 0) {
            throw new Error("Target score must be greater than 0")
        }
        if (!memento.scores || !Array.isArray(memento.scores) || memento.scores.length !== memento.players.length) {
            throw new Error("Scores count must match players count")
        }
        if (memento.scores.some((s: number) => typeof s !== 'number' || s < 0)) {
            throw new Error("Scores must be non-negative numbers")
        }
        const winners = memento.scores.filter((s: number) => s >= memento.targetScore)
        if (winners.length > 1) {
            throw new Error("Cannot have more than 1 winner")
        }
        const isFinished = winners.length > 0
        if (!isFinished && !memento.currentRound) {
            throw new Error("Unfinished game must have a current round")
        }

        const game = Object.create(UnoGame.prototype) as UnoGame;
        (game as any).players = [...memento.players];
        (game as any)._targetScore = memento.targetScore;
        (game as any).scores = [...memento.scores];
        (game as any).cardsPerPlayer = memento.cardsPerPlayer ?? 7;
        (game as any).randomizer = randomizer;
        (game as any).shuffler = shuffler;

        if (!isFinished && memento.currentRound) {
            const round = createRoundFromMemento(memento.currentRound, shuffler);
            (game as any).setupRound(round, memento.currentRound.dealer ?? 0);
        } else {
            (game as any).currentRound_ = undefined;
        }

        return game;
    }
}

export function createGame(props: Partial<GameConfig> = {}): Game {
    return new UnoGame(
        props.players ?? ['A', 'B'],
        props.targetScore ?? 500,
        props.randomizer ?? standardRandomizer,
        props.shuffler ?? standardShuffler,
        props.cardsPerPlayer ?? 7
    )
}

export function createGameFromMemento(
    memento: any,
    randomizer: Randomizer = standardRandomizer,
    shuffler: Shuffler<Card> = standardShuffler
): Game {
    return UnoGame.fromMemento(memento, randomizer, shuffler)
}
