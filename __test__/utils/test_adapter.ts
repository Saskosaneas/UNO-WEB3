import { Card, Deck } from '../../src/model/deck'
import { Round } from '../../src/model/round'
import { Randomizer, Shuffler, standardRandomizer, standardShuffler } from '../../src/utils/random_utils'

// Fix (or import) these types:
type Game = any

export { createRound, createRoundFromMemento } from '../../src/model/round'
export { createInitialDeck, createDeckFromMemento } from '../../src/model/deck'


export type HandConfig = {
  players: string[]
  dealer: number
  shuffler?: Shuffler<Card>
  cardsPerPlayer?: number
}

export { Game, GameMemento, GameConfig, createGame, createGameFromMemento } from '../../src/model/uno'
