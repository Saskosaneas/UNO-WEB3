import { Shuffler, standardShuffler } from "../utils/random_utils"

export const colors = ['RED', 'BLUE', 'GREEN', 'YELLOW'] as const
export type Color = typeof colors[number]

export const types = ['NUMBERED', 'SKIP', 'REVERSE', 'DRAW', 'WILD', 'WILD DRAW'] as const
export type Type = typeof types[number]




export type NumberedCard =
    {
        type: 'NUMBERED',
        color: Color,
        number: number
    }

export type SkipCard =
    {
        type: "SKIP",
        color: Color
    }

export type ReverseCard =
    {
        type: "REVERSE",
        color: Color
    }

export type DrawCard = {
    type: "DRAW",
    color: Color
}

export type WildCard = {
    type: "WILD",

}

export type WildDrawCard = {
    type: "WILD DRAW"
}

export type ColouredCard = NumberedCard | SkipCard | ReverseCard | DrawCard
export type WildCards = WildCard | WildDrawCard
export type Card = ColouredCard | WildCards

export type TypedCard<T extends Type> = Extract<Card, { type: T }>

export interface Deck {
    readonly size: number
    deal(): Card | undefined
    shuffle(shuffler?: Shuffler<Card>): void
    filter(predicate: (card: Card) => boolean): Deck
    toMemento(): Record<string, string | number>[]
}

export class UnoDeck implements Deck {
    private cards: Card[]

    constructor(cards: Card[] = []) {
        this.cards = cards
    }

    get size(): number {
        return this.cards.length
    }

    deal(): Card | undefined {
        return this.cards.shift()
    }

    shuffle(shuffler: Shuffler<Card> = standardShuffler): void {
        shuffler(this.cards)
    }

    filter(predicate: (card: Card) => boolean): Deck {
        return new UnoDeck(this.cards.filter(predicate))
    }

    toMemento(): Record<string, string | number>[] {
        return this.cards.map(card => ({ ...card }))
    }

}

export function hasColor(card: Card, color: Color): boolean {
    return 'color' in card && card.color === color
}

export function hasNumber(card: Card, number: number): boolean {
    return 'number' in card && card.number === number
}

export function createInitialDeck(): Deck {
    const cards: Card[] = []

    // 1 of zero card for each color
    for (const color of colors) {
        cards.push({ type: "NUMBERED", color, number: 0 })
        // 2 of number 1 untill 9 through each color
        for (let n = 1; n <= 9; n++) {
            cards.push({ type: 'NUMBERED', color, number: n })
            cards.push({ type: 'NUMBERED', color, number: n })
        }
        // 2 skip, 2 reverse and 2 draw
        cards.push({ type: 'SKIP', color })
        cards.push({ type: 'SKIP', color })

        cards.push({ type: 'REVERSE', color })
        cards.push({ type: 'REVERSE', color })

        cards.push({ type: 'DRAW', color })
        cards.push({ type: 'DRAW', color })
    }
    // 4 wild and 4 wild draw
    for (let n = 0; n < 4; n++) {
        cards.push({ type: "WILD" })
        cards.push({ type: "WILD DRAW" })
    }

    return new UnoDeck(cards)
}

export function createDeckFromMemento(cards: Record<string, string | number>[]): Deck {
    const parsedCards: Card[] = []
    for (const raw of cards) {

        if (!raw.type || !types.includes(raw.type as any)) {
            throw new Error(`Invalid card type: ${raw.type}`)
        }

        if (raw.type === 'NUMBERED') {
            if (!raw.color || raw.number === undefined || typeof raw.number !== 'number') {
                throw new Error('Numbered card must have color and number')
            }
        }

        if (raw.type === 'SKIP' || raw.type === 'REVERSE' || raw.type === 'DRAW') {
            if (!raw.color) {
                throw new Error(`${raw.type} card must have color`)
            }
        }
        parsedCards.push(raw as unknown as Card)
    }
    return new UnoDeck(parsedCards)
}


