import type { Card, Color } from '@/model/deck';

// Messages: Main Thread -> Bot Worker
export type MainToWorkerMessage =
    | {
        type: 'INIT';
        payload: {
            playerIndex: number;
            name: string;
            unoSayProbability: number;    // e.g. 0.85 (85% chance to shout UNO)
            unoCatchProbability: number;  // e.g. 0.60 (60% chance to catch opponents)
        };
    }
    | {
        type: 'YOUR_TURN';
        payload: {
            hand: Card[];
            topCard: Card;
            currentColor: Color;
            drawPileCount: number;
            playersCardCounts: { playerIndex: number; cardCount: number }[];
            vulnerablePlayerIndex: number | null; // Opponent who forgot UNO
        };
    }
    | {
        type: 'OPPONENT_ACTION';
        payload: {
            playerIndex: number;
            vulnerableToUnoPenalty: boolean;
        };
    };

// Messages: Bot Worker -> Main Thread
export type WorkerToMainMessage =
    | { type: 'READY'; payload: { playerIndex: number } }
    | {
        type: 'PLAY_CARD';
        payload: {
            playerIndex: number;
            cardIndex: number;
            declaredColor?: Color;
            saidUno: boolean;
        };
    }
    | { type: 'DRAW_CARD'; payload: { playerIndex: number } }
    | {
        type: 'CATCH_UNO';
        payload: {
            accuserIndex: number;
            accusedIndex: number;
        };
    };