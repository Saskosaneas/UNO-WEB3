import { Shuffler, standardShuffler } from "../utils/random_utils";
import { Card, Color, Deck, UnoDeck, createInitialDeck, createDeckFromMemento, colors } from "./deck";

export interface Round {
    readonly playerCount: number
    player(index: number): string
    readonly dealer: number
    playerHand(index: number): Card[]
    playerInTurn(): number | undefined
    discardPile(): { size: number; top(): Card | undefined }
    drawPile(): Deck

    canPlay(cardIndex: number): boolean
    canPlayAny(): boolean
    play(cardIndex: number, chosenColor?: Color): Card
    draw(): Card
    toMemento(): any

    hasEnded(): boolean
    winner(): number | undefined
    score(): number | undefined
    sayUno(playerIndex: number): void
    catchUnoFailure(args: { accuser: number; accused: number }): boolean
    onEnd(callback: (event: { winner: number }) => void): void
}

export class UnoRound implements Round {
    private players: string[]
    private _dealer: number
    private hands: Card[][] = []
    private discardCards: Card[] = []
    private _drawPile!: Deck
    private _playerInTurn: number = 0
    private direction: number = 1
    private currentColor?: Color
    private shuffler: Shuffler<Card>

    private vulnerablePlayer: number | undefined = undefined
    private unoSaidInTurn: boolean = false
    private endCallbacks: Array<(event: { winner: number }) => void> = []

    constructor(
        players: string[],
        dealer: number,
        shuffler: Shuffler<Card> = standardShuffler,
        cardsPerPlayer: number = 7
    ) {
        if (players.length < 2 || players.length > 10) {
            throw new Error("Round requires between 2 and 10 players")
        }
        this.shuffler = shuffler
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

        if ('color' in starterCard) {
            this.currentColor = starterCard.color
        }
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
    playerInTurn(): number | undefined {
        if (this.hasEnded()) {
            return undefined
        }
        return this._playerInTurn
    }
    discardPile(): { size: number; top(): Card | undefined } {
        return {
            size: this.discardCards.length,
            top: () => this.discardCards[0]
        }
    }
    drawPile(): Deck {
        return this._drawPile
    }

    hasEnded(): boolean {
        return this.hands.some(h => h.length === 0)
    }

    winner(): number | undefined {
        const idx = this.hands.findIndex(h => h.length === 0)
        return idx === -1 ? undefined : idx
    }

    score(): number | undefined {
        if (!this.hasEnded()) {
            return undefined
        }
        const win = this.winner()!
        let total = 0
        for (let p = 0; p < this.players.length; p++) {
            if (p === win) continue
            for (const card of this.hands[p]) {
                if (card.type === 'NUMBERED') {
                    total += card.number
                } else if (card.type === 'SKIP' || card.type === 'REVERSE' || card.type === 'DRAW') {
                    total += 20
                } else if (card.type === 'WILD' || card.type === 'WILD DRAW') {
                    total += 50
                }
            }
        }
        return total
    }

    sayUno(playerIndex: number): void {
        if (this.hasEnded()) {
            throw new Error("Round has ended")
        }
        if (playerIndex < 0 || playerIndex >= this.players.length) {
            throw new Error("Player index out of bounds")
        }
        if (playerIndex === this._playerInTurn) {
            this.unoSaidInTurn = true
        }
        if (this.vulnerablePlayer === playerIndex) {
            this.vulnerablePlayer = undefined
        }
    }

    catchUnoFailure({ accuser, accused }: { accuser: number; accused: number }): boolean {
        if (accuser < 0 || accuser >= this.players.length) {
            throw new Error("Accuser out of bounds")
        }
        if (accused < 0 || accused >= this.players.length) {
            throw new Error("Accused out of bounds")
        }
        if (this.vulnerablePlayer === accused) {
            this.dealCardsToPlayer(accused, 4)
            this.vulnerablePlayer = undefined
            return true
        }
        return false
    }

    onEnd(callback: (event: { winner: number }) => void): void {
        this.endCallbacks.push(callback)
    }

    canPlay(cardIndex: number): boolean {
        if (this.hasEnded()) {
            return false
        }
        const pit = this.playerInTurn()
        if (pit === undefined) {
            return false
        }
        const currentHand = this.hands[pit]
        if (cardIndex < 0 || cardIndex >= currentHand.length) {
            return false
        }

        const card = currentHand[cardIndex]
        const topCard = this.discardCards[0]

        // 1. Regular Wild card is ALWAYS legal
        if (card.type === 'WILD') {
            return true
        }

        // 2. Wild Draw 4 is ONLY legal if player has NO card matching the current color
        if (card.type === 'WILD DRAW') {
            const hasMatchingColor = currentHand.some(c => 'color' in c && c.color === this.currentColor)
            return !hasMatchingColor
        }

        // 3. Same color as active color
        if ('color' in card && card.color === this.currentColor) {
            return true
        }

        // 4. Same number on numbered cards
        if (card.type === 'NUMBERED' && topCard.type === 'NUMBERED' && card.number === topCard.number) {
            return true
        }

        // 5. Same action type (Skip on Skip, Reverse on Reverse, Draw on Draw)
        if (card.type === topCard.type && (card.type === 'SKIP' || card.type === 'REVERSE' || card.type === 'DRAW')) {
            return true
        }

        return false
    }

    canPlayAny(): boolean {
        if (this.hasEnded()) {
            return false
        }
        const pit = this.playerInTurn()
        if (pit === undefined) {
            return false
        }
        const currentHand = this.hands[pit]
        return currentHand.some((_, index) => this.canPlay(index))
    }

    private replenishDrawPile(): void {
        if (this.discardCards.length > 1) {
            const top = this.discardCards[0]
            const cardsToShuffle = this.discardCards.slice(1)
            this.discardCards = [top]
            this._drawPile = new UnoDeck(cardsToShuffle)
            this._drawPile.shuffle(this.shuffler)
        }
    }

    private drawSingleCard(): Card | undefined {
        if (this._drawPile.size === 0) {
            this.replenishDrawPile()
        }
        const card = this._drawPile.deal()
        if (this._drawPile.size === 0) {
            this.replenishDrawPile()
        }
        return card
    }

    private dealCardsToPlayer(playerIndex: number, count: number): void {
        for (let i = 0; i < count; i++) {
            const card = this.drawSingleCard()
            if (card) {
                this.hands[playerIndex].push(card)
            }
        }
    }

    play(cardIndex: number, chosenColor?: Color): Card {
        if (this.hasEnded()) {
            throw new Error("Round is finished")
        }
        const pit = this.playerInTurn()
        if (pit === undefined) {
            throw new Error("Round is finished")
        }
        const currentHand = this.hands[pit]
        if (cardIndex < 0 || cardIndex >= currentHand.length) {
            throw new Error(`Card index ${cardIndex} out of bounds`)
        }

        const card = currentHand[cardIndex]

        // Boundary checks for color naming:
        if (card.type === 'WILD' || card.type === 'WILD DRAW') {
            if (!chosenColor) {
                throw new Error("Must name a color on wild card")
            }
        } else {
            if (chosenColor) {
                throw new Error("Cannot name a color on a colored card")
            }
        }

        if (!this.canPlay(cardIndex)) {
            throw new Error("Illegal play")
        }

        // Close accusation window for previous player
        this.vulnerablePlayer = undefined

        // Remove card from player hand and place on discard pile
        currentHand.splice(cardIndex, 1)
        this.discardCards.unshift(card)

        // Update active color
        if (card.type === 'WILD' || card.type === 'WILD DRAW') {
            this.currentColor = chosenColor
        } else {
            this.currentColor = card.color
        }

        // Check UNO shout vulnerability:
        if (currentHand.length === 1) {
            if (!this.unoSaidInTurn) {
                this.vulnerablePlayer = pit
            }
        }
        this.unoSaidInTurn = false

        const n = this.players.length

        // Special 2-Player Rules:
        if (n === 2) {
            if (card.type === 'REVERSE' || card.type === 'SKIP') {
                // Player takes another turn immediately!
            } else if (card.type === 'DRAW') {
                this.dealCardsToPlayer((pit + 1) % 2, 2)
            } else if (card.type === 'WILD DRAW') {
                this.dealCardsToPlayer((pit + 1) % 2, 4)
            } else {
                this._playerInTurn = (pit + 1) % 2
            }
        } else {
            // Standard 3-10 Player Rules:
            if (card.type === 'REVERSE') {
                this.direction *= -1
                this._playerInTurn = (pit + this.direction + n) % n
            } else if (card.type === 'SKIP') {
                this._playerInTurn = (pit + 2 * this.direction + n * 2) % n
            } else if (card.type === 'DRAW') {
                const nextPlayer = (pit + this.direction + n) % n
                this.dealCardsToPlayer(nextPlayer, 2)
                this._playerInTurn = (pit + 2 * this.direction + n * 2) % n
            } else if (card.type === 'WILD DRAW') {
                const nextPlayer = (pit + this.direction + n) % n
                this.dealCardsToPlayer(nextPlayer, 4)
                this._playerInTurn = (pit + 2 * this.direction + n * 2) % n
            } else {
                this._playerInTurn = (pit + this.direction + n) % n
            }
        }

        if (this.hasEnded()) {
            this.vulnerablePlayer = undefined
            const win = this.winner()!
            for (const cb of this.endCallbacks) {
                cb({ winner: win })
            }
        }

        return card
    }

    draw(): Card {
        if (this.hasEnded()) {
            throw new Error("Round is finished")
        }
        const pit = this.playerInTurn()
        if (pit === undefined) {
            throw new Error("Round is finished")
        }
        // Drawing a card closes any open accusation window
        this.vulnerablePlayer = undefined

        const drawn = this.drawSingleCard()
        if (!drawn) {
            throw new Error("No cards available to draw")
        }
        const currentHand = this.hands[pit]
        currentHand.push(drawn)

        // If drawn card cannot be played, turn passes to next player:
        if (!this.canPlay(currentHand.length - 1)) {
            const n = this.players.length
            this._playerInTurn = (this._playerInTurn + this.direction + n) % n
            this.unoSaidInTurn = false
        }
        // If it CAN be played, player remains in turn to play it!

        return drawn
    }

    toMemento(): any {
        const res: any = {
            players: [...this.players],
            hands: this.hands.map(h => h.map(c => ({ ...c }))),
            drawPile: this._drawPile.toMemento(),
            discardPile: this.discardCards.map(c => ({ ...c })),
            currentColor: this.currentColor,
            currentDirection: this.direction === 1 ? 'clockwise' : 'counterclockwise',
            dealer: this._dealer,
        }
        const pit = this.playerInTurn()
        if (pit !== undefined) {
            res.playerInTurn = pit
        }
        return res
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

export function createRoundFromMemento(
    memento: any,
    shuffler: Shuffler<Card> = standardShuffler
): Round {
    if (!memento) {
        throw new Error("Memento is required")
    }
    if (!memento.players || !Array.isArray(memento.players) || memento.players.length < 2) {
        throw new Error("At least 2 players required")
    }
    if (!memento.hands || !Array.isArray(memento.hands) || memento.hands.length !== memento.players.length) {
        throw new Error("Hands count must match players count")
    }
    const winners = memento.hands.filter((h: any[]) => h.length === 0)
    if (winners.length > 1) {
        throw new Error("Cannot have more than 1 winner")
    }
    if (!memento.discardPile || !Array.isArray(memento.discardPile) || memento.discardPile.length === 0) {
        throw new Error("Discard pile cannot be empty")
    }
    if (!colors.includes(memento.currentColor)) {
        throw new Error(`Invalid currentColor: ${memento.currentColor}`)
    }
    const topDiscard = memento.discardPile[0]
    if ('color' in topDiscard && topDiscard.color && topDiscard.color !== memento.currentColor) {
        throw new Error("Inconsistent currentColor with top card of discard pile")
    }
    if (typeof memento.dealer !== 'number' || memento.dealer < 0 || memento.dealer >= memento.players.length) {
        throw new Error("Dealer out of bounds")
    }
    const isFinished = winners.length > 0
    if (!isFinished) {
        if (memento.playerInTurn === undefined || memento.playerInTurn === null) {
            throw new Error("playerInTurn is required when round is not finished")
        }
    }
    if (memento.playerInTurn !== undefined && memento.playerInTurn !== null) {
        if (typeof memento.playerInTurn !== 'number' || memento.playerInTurn < 0 || memento.playerInTurn >= memento.players.length) {
            throw new Error("playerInTurn out of bounds")
        }
    }

    const round = Object.create(UnoRound.prototype) as UnoRound;
    (round as any).players = [...memento.players];
    (round as any)._dealer = memento.dealer;
    (round as any).hands = memento.hands.map((h: any[]) => h.map((c: any) => ({ ...c })));
    (round as any).discardCards = memento.discardPile.map((c: any) => ({ ...c }));
    (round as any)._drawPile = createDeckFromMemento(memento.drawPile || []);
    (round as any).direction = memento.currentDirection === 'counterclockwise' ? -1 : 1;
    (round as any).currentColor = memento.currentColor;
    (round as any).shuffler = shuffler;
    (round as any)._playerInTurn = memento.playerInTurn ?? 0;
    (round as any).vulnerablePlayer = undefined;
    (round as any).unoSaidInTurn = false;
    (round as any).endCallbacks = [];

    return round
}


