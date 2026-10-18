import { Card, Deck } from '../../src/model/deck'
import { Round } from '../../src/model/round'
import { Randomizer, Shuffler, standardRandomizer, standardShuffler } from '../../src/utils/random_utils'

// Fix (or import) these types:
type Game = any

export { createRound } from '../../src/model/round'
export { createInitialDeck, createDeckFromMemento } from '../../src/model/deck'


export type HandConfig = {
  players: string[]
  dealer: number
  shuffler?: Shuffler<Card>
  cardsPerPlayer?: number
}


export function createRoundFromMemento(memento: any, shuffler: Shuffler<Card> = standardShuffler): Round {
}

export type GameConfig = {
  players: string[]
  targetScore: number
  randomizer: Randomizer
  shuffler: Shuffler<Card>
  cardsPerPlayer: number
}

export function createGame(props: Partial<GameConfig>): Game {
}

export function createGameFromMemento(memento: any, randomizer: Randomizer = standardRandomizer, shuffler: Shuffler<Card> = standardShuffler): Game {
}
