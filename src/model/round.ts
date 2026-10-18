import { Shuffler, standardShuffler } from "../utils/random_utils";
import { Card, Deck, UnoDeck, createInitialDeck } from "./deck";

export interface Round {
    readonly playerCount: number
    player(index: number): string
    readonly dealer: number
    playerHand(index: number): Card[]
    playerInTurn(): number
    discardPile(): { size: number; top(): Card | undefined }
    drawPile(): Deck
}

export class UnoRound implements Round {
    private players: string[]
    private _dealer: number
    private hands: Card[][] = []
    private discardCards: Card[] = []
    private _drawPile!: Deck
    private _playerInTurn: number = 0
    private direction: number = 1

    constructor(
        players: string[],
        dealer: number,
        shuffler: Shuffler<Card> = standardShuffler,
        cardsPerPlayer: number = 7
    ) {
        if (players.length < 2 || players.length > 10) {
            throw new Error("Round requires between 2 and 10 players")
        }
        if (dealer < 0 || dealer >= players.length) {
            throw new Error("Dealer index out of bounds")
        }
        this.players = [...players]
        this._dealer = dealer
        let deck = createInitialDeck()
        deck.shuffle(shuffler)
        // Deal hands once
        this.hands = []
        for (let p = 0; p < players.length; p++) {
            const hand: Card[] = []
            for (let c = 0; c < cardsPerPlayer; c++) {
                hand.push(deck.deal()!)
            }
            this.hands.push(hand)
        }
        // Turn up starter card; if Wild, put back in draw pile and reshuffle!
        let starterCard = deck.deal()!
        while (starterCard.type === 'WILD' || starterCard.type === 'WILD DRAW') {
            const remainingCards: Card[] = [starterCard]
            while (deck.size > 0) {
                remainingCards.push(deck.deal()!)
            }
            deck = new UnoDeck(remainingCards)
            deck.shuffle(shuffler)
            starterCard = deck.deal()!
        }
        this.discardCards = [starterCard]
        this._drawPile = deck
        if (starterCard.type === 'REVERSE') {
            this.direction = -1
            this._playerInTurn = (dealer - 1 + players.length) % players.length
        } else if (starterCard.type === 'SKIP') {
            this._playerInTurn = (dealer + 2) % players.length
        } else if (starterCard.type === 'DRAW') {
            const firstPlayer = (dealer + 1) % players.length
            this.hands[firstPlayer].push(this._drawPile.deal()!)
            this.hands[firstPlayer].push(this._drawPile.deal()!)
            this._playerInTurn = (dealer + 2) % players.length
        } else {
            this._playerInTurn = (dealer + 1) % players.length
        }
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
    get dealer(): number {
        return this._dealer
    }
    playerHand(index: number): Card[] {
        if (index < 0 || index >= this.players.length) {
            throw new Error(`Player index ${index} out of bounds`)
        }
        return this.hands[index]
    }
    playerInTurn(): number {
        return this._playerInTurn
    }
    discardPile(): { size: number; top(): Card | undefined } {
        return {
            size: this.discardCards.length,
            top: () => this.discardCards[this.discardCards.length - 1]
        }
    }
    drawPile(): Deck {
        return this._drawPile
    }
}
export type HandConfig = {
    players: string[]
    dealer: number
    shuffler?: Shuffler<Card>
    cardsPerPlayer?: number
}
export function createRound({
    players,
    dealer,
    shuffler = standardShuffler,
    cardsPerPlayer = 7
}: HandConfig): Round {
    return new UnoRound(players, dealer, shuffler, cardsPerPlayer)
}


