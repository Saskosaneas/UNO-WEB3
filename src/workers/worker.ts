import type { Card, Color } from '@/model/deck';
import type { MainToWorkerMessage, WorkerToMainMessage } from '@/types/worker_message';

// State maintained inside this worker instance
let playerIndex = -1;
let botName = 'Bot';
let unoSayProbability = 0.85;     // 85% chance to remember to shout UNO
let unoCatchProbability = 0.60;   // 60% chance to catch an opponent who forgot UNO

/**
 * Checks if a specific card in hand can be legally played.
 * Mirrors the official UNO rules from Assignment 1.
 */
function isCardPlayable(card: Card, hand: Card[], topCard: Card, currentColor: Color): boolean {
  // 1. Regular Wild is always playable
  if (card.type === 'WILD') {
    return true;
  }

  // 2. Wild Draw 4 is only legal if the player has no card matching the active color
  if (card.type === 'WILD DRAW') {
    const hasColorMatch = hand.some(c => 'color' in c && c.color === currentColor);
    return !hasColorMatch;
  }

  // 3. Same color
  if ('color' in card && card.color === currentColor) {
    return true;
  }

  // 4. Same number on numbered cards
  if (card.type === 'NUMBERED' && topCard.type === 'NUMBERED' && card.number === topCard.number) {
    return true;
  }

  // 5. Same action type (Skip, Reverse, Draw)
  if (card.type === topCard.type && (card.type === 'SKIP' || card.type === 'REVERSE' || card.type === 'DRAW')) {
    return true;
  }

  return false;
}

/**
 * Picks the optimal color when playing a Wild card.
 * Chooses the color the bot holds the most of in its remaining hand.
 */
function chooseBestColor(hand: Card[], excludedIndex: number): Color {
  const counts: Record<Color, number> = {
    RED: 0,
    BLUE: 0,
    GREEN: 0,
    YELLOW: 0
  };

  hand.forEach((card, idx) => {
    if (idx !== excludedIndex && 'color' in card) {
      counts[card.color]++;
    }
  });

  const colors: Color[] = ['RED', 'BLUE', 'GREEN', 'YELLOW'];
  let bestColor: Color = 'RED';
  let maxCount = -1;

  for (const color of colors) {
    if (counts[color] > maxCount) {
      maxCount = counts[color];
      bestColor = color;
    }
  }

  return bestColor;
}

/**
 * Decides which card to play from hand, or to draw.
 */
function decideMove(
  hand: Card[],
  topCard: Card,
  currentColor: Color
): { cardIndex: number; declaredColor?: Color; saidUno: boolean } | null {
  // Find all legal plays
  const legalIndices: number[] = [];
  for (let i = 0; i < hand.length; i++) {
    if (isCardPlayable(hand[i], hand, topCard, currentColor)) {
      legalIndices.push(i);
    }
  }

  // No legal play -> must draw
  if (legalIndices.length === 0) {
    return null;
  }

  // Strategy:
  // 1. Prefer matching color / number / action cards first to save Wild cards
  // 2. Play Wild cards only when needed or advantageous
  const nonWilds = legalIndices.filter(i => hand[i].type !== 'WILD' && hand[i].type !== 'WILD DRAW');
  const chosenIndex = nonWilds.length > 0
    ? nonWilds[Math.floor(Math.random() * nonWilds.length)]
    : legalIndices[Math.floor(Math.random() * legalIndices.length)];

  const cardToPlay = hand[chosenIndex];
  let declaredColor: Color | undefined = undefined;

  if (cardToPlay.type === 'WILD' || cardToPlay.type === 'WILD DRAW') {
    declaredColor = chooseBestColor(hand, chosenIndex);
  }

  // "UNO!" shout mechanics:
  // If playing this card leaves the bot with exactly 1 card in hand:
  let saidUno = false;
  if (hand.length === 2) {
    saidUno = Math.random() < unoSayProbability;
  }

  return {
    cardIndex: chosenIndex,
    declaredColor,
    saidUno
  };
}

// Listen for messages from the main thread
self.onmessage = (event: MessageEvent<MainToWorkerMessage>) => {
  const msg = event.data;

  switch (msg.type) {
    case 'INIT': {
      playerIndex = msg.payload.playerIndex;
      botName = msg.payload.name;
      unoSayProbability = msg.payload.unoSayProbability ?? 0.85;
      unoCatchProbability = msg.payload.unoCatchProbability ?? 0.60;

      // Reply that bot is ready
      const response: WorkerToMainMessage = {
        type: 'READY',
        payload: { playerIndex }
      };
      self.postMessage(response);
      break;
    }

    case 'YOUR_TURN': {
      const { hand, topCard, currentColor, vulnerablePlayerIndex } = msg.payload;

      // Small natural thinking delay (300-600ms) for realism in UI
      const thinkDelay = 350 + Math.random() * 250;

      setTimeout(() => {
        // First check: Can we catch an opponent who forgot to say UNO before we play?
        if (
          vulnerablePlayerIndex !== null &&
          vulnerablePlayerIndex !== playerIndex &&
          Math.random() < unoCatchProbability
        ) {
          const catchMsg: WorkerToMainMessage = {
            type: 'CATCH_UNO',
            payload: {
              accuserIndex: playerIndex,
              accusedIndex: vulnerablePlayerIndex
            }
          };
          self.postMessage(catchMsg);
        }

        // Now decide our own move
        const move = decideMove(hand, topCard, currentColor);

        if (move === null) {
          const drawMsg: WorkerToMainMessage = {
            type: 'DRAW_CARD',
            payload: { playerIndex }
          };
          self.postMessage(drawMsg);
        } else {
          const playMsg: WorkerToMainMessage = {
            type: 'PLAY_CARD',
            payload: {
              playerIndex,
              cardIndex: move.cardIndex,
              declaredColor: move.declaredColor,
              saidUno: move.saidUno
            }
          };
          self.postMessage(playMsg);
        }
      }, thinkDelay);

      break;
    }

    case 'OPPONENT_ACTION': {
      const { playerIndex: opponentIndex, vulnerableToUnoPenalty } = msg.payload;

      // Opponent just played down to 1 card without saying UNO!
      if (
        vulnerableToUnoPenalty &&
        opponentIndex !== playerIndex &&
        Math.random() < unoCatchProbability
      ) {
        // Quick reaction delay (200-500ms)
        setTimeout(() => {
          const catchMsg: WorkerToMainMessage = {
            type: 'CATCH_UNO',
            payload: {
              accuserIndex: playerIndex,
              accusedIndex: opponentIndex
            }
          };
          self.postMessage(catchMsg);
        }, 200 + Math.random() * 300);
      }
      break;
    }
  }
};

