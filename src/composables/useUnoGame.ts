import { ref, computed, inject, onUnmounted, type InjectionKey } from 'vue';
import { UnoRound } from '@/model/round';
import { UnoGame } from '@/model/uno';
import type { Card, Color } from '@/model/deck';
import type {
  MainToWorkerMessage,
  WorkerToMainMessage
} from '@/types/worker_message';

export type GameScreen = 'lobby' | 'playing' | 'round_over' | 'game_over';
export type GameMode = 'single' | 'match'; // single round or 500-pt match

export interface PlayerInfo {
  index: number;
  name: string;
  isBot: boolean;
  cardCount: number;
  score: number;
}

// Pause before a bot acts, so the table is readable and players can react
const BOT_TURN_DELAY_MS = 900;
const BOT_TURN_DELAY_VULNERABLE_MS = 2500; // Leaves time to catch a missed UNO

export function useUnoGame() {
  // Navigation & Game Config
  const screen = ref<GameScreen>('lobby');
  const gameMode = ref<GameMode>('single');
  const targetScore = 500;

  // Active instances
  let unoRound: UnoRound | null = null;
  let unoGame: UnoGame | null = null;
  const botWorkers: Worker[] = [];
  let botTurnTimer: ReturnType<typeof setTimeout> | null = null;

  // Reactive UI State
  const players = ref<PlayerInfo[]>([]);
  const humanIndex = 0;
  const playerInTurn = ref<number>(0);
  const humanHand = ref<Card[]>([]);
  const topCard = ref<Card | null>(null);
  const activeColor = ref<Color | null>(null);
  const direction = ref<'clockwise' | 'counterclockwise'>('clockwise');
  const drawPileCount = ref<number>(0);
  const discardPileCount = ref<number>(0);
  const roundNumber = ref<number>(1);

  // Turn & Accusation state
  const vulnerablePlayerIndex = ref<number | null>(null);
  const humanSaidUnoThisTurn = ref<boolean>(false);
  const pendingWildIndex = ref<number | null>(null);

  // Notifications & Log
  const gameLog = ref<string[]>([]);
  const notification = ref<{ text: string; type: 'info' | 'success' | 'warning' | 'danger' } | null>(null);

  // End game state
  const roundWinner = ref<PlayerInfo | null>(null);
  const roundScore = ref<number>(0);
  const matchWinner = ref<PlayerInfo | null>(null);

  function notify(text: string, type: 'info' | 'success' | 'warning' | 'danger' = 'info', duration = 3000) {
    notification.value = { text, type };
    if (duration > 0) {
      setTimeout(() => {
        if (notification.value?.text === text) {
          notification.value = null;
        }
      }, duration);
    }
  }

  function addLog(entry: string) {
    gameLog.value.unshift(entry);
    if (gameLog.value.length > 50) {
      gameLog.value.pop();
    }
  }

  // --- Computed Helpers ---
  const isHumanTurn = computed(() => {
    return screen.value === 'playing' && playerInTurn.value === humanIndex;
  });

  const playableCardIndices = computed(() => {
    if (!unoRound || !isHumanTurn.value) return new Set<number>();
    const indices = new Set<number>();
    for (let i = 0; i < humanHand.value.length; i++) {
      if (unoRound.canPlay(i)) {
        indices.add(i);
      }
    }
    return indices;
  });

  const canHumanDraw = computed(() => {
    return isHumanTurn.value && unoRound !== null && !unoRound.hasEnded();
  });

  const canSayUno = computed(() => {
    if (screen.value !== 'playing') return false;
    if (vulnerablePlayerIndex.value === humanIndex) return true;
    return (
      isHumanTurn.value &&
      humanHand.value.length === 2 &&
      playableCardIndices.value.size > 0 &&
      !humanSaidUnoThisTurn.value
    );
  });

  const canCatchUno = computed(() => {
    return (
      screen.value === 'playing' &&
      vulnerablePlayerIndex.value !== null &&
      vulnerablePlayerIndex.value !== humanIndex
    );
  });

  // --- Worker Lifecycle ---
  function terminateBots() {
    if (botTurnTimer !== null) {
      clearTimeout(botTurnTimer);
      botTurnTimer = null;
    }
    botWorkers.forEach(w => w.terminate());
    botWorkers.length = 0;
  }

  function spawnBotWorkers(botCount: number) {
    terminateBots();

    for (let i = 1; i <= botCount; i++) {
      const worker = new Worker(
        new URL('../workers/worker.ts', import.meta.url),
        { type: 'module' }
      );

      // Bot difficulty configuration
      const initMsg: MainToWorkerMessage = {
        type: 'INIT',
        payload: {
          playerIndex: i,
          name: `Bot ${i}`,
          unoSayProbability: 0.82 + Math.random() * 0.12, // 82% - 94%
          unoCatchProbability: 0.55 + Math.random() * 0.25 // 55% - 80%
        }
      };
      worker.postMessage(initMsg);

      worker.onmessage = (event: MessageEvent<WorkerToMainMessage>) => {
        handleWorkerMessage(event.data);
      };

      botWorkers.push(worker);
    }
  }

  // --- State Synchronization ---
  function currentVulnerablePlayer(): number | null {
    // Read from internal state: the Round interface doesn't expose it
    return (unoRound as any)?.vulnerablePlayer ?? null;
  }

  function syncState() {
    if (!unoRound) return;

    const memento = unoRound.toMemento();

    // Human Hand & Piles
    // Copy: the model mutates this array in place, which Vue can't see
    humanHand.value = [...unoRound.playerHand(humanIndex)];
    topCard.value = unoRound.discardPile().top() ?? null;
    activeColor.value = memento.currentColor;
    direction.value = memento.currentDirection;
    drawPileCount.value = unoRound.drawPile().size;
    discardPileCount.value = unoRound.discardPile().size;

    vulnerablePlayerIndex.value = currentVulnerablePlayer();

    // Update Player Info (card counts & scores)
    players.value = players.value.map(p => ({
      ...p,
      cardCount: unoRound!.playerHand(p.index).length,
      score: unoGame ? unoGame.score(p.index) : p.score
    }));

    // Update current player
    const pit = unoRound.playerInTurn();
    if (pit !== undefined) {
      playerInTurn.value = pit;
    }
  }

  // --- Game Flow & Turns ---
  function checkRoundEnd(): boolean {
    if (!unoRound || !unoRound.hasEnded()) return false;

    const winIdx = unoRound.winner()!;
    const scored = unoRound.score() ?? 0;

    // Sync first: it replaces the player objects with the final counts & scores
    syncState();
    const winnerPlayer = players.value[winIdx];

    roundWinner.value = winnerPlayer;
    roundScore.value = scored;

    if (unoGame) {
      // Full match mode
      const matchWinIdx = unoGame.winner();
      if (matchWinIdx !== undefined) {
        matchWinner.value = players.value[matchWinIdx];
        screen.value = 'game_over';
        notify(`🏆 ${matchWinner.value.name} won the UNO match with ${unoGame.score(matchWinIdx)} points!`, 'success', 6000);
        addLog(`Match ended. Champion: ${matchWinner.value.name}`);
        return true;
      } else {
        screen.value = 'round_over';
        notify(`Round over! ${winnerPlayer.name} won the round (+${scored} pts).`, 'info', 5000);
        addLog(`Round ended. Winner: ${winnerPlayer.name} (+${scored} pts)`);
        return true;
      }
    } else {
      // Single round mode
      winnerPlayer.score += scored;
      screen.value = 'game_over';
      matchWinner.value = winnerPlayer;
      notify(`🏆 ${winnerPlayer.name} won the game (+${scored} pts)!`, 'success', 6000);
      addLog(`Game ended. Winner: ${winnerPlayer.name}`);
      return true;
    }
  }

  function advanceTurn() {
    if (checkRoundEnd()) return;

    syncState();

    const currentPit = playerInTurn.value;

    if (currentPit === humanIndex) {
      humanSaidUnoThisTurn.value = false;
      addLog(`Your turn!`);
    } else {
      const delay = vulnerablePlayerIndex.value !== null
        ? BOT_TURN_DELAY_VULNERABLE_MS
        : BOT_TURN_DELAY_MS;
      botTurnTimer = setTimeout(() => sendBotTurn(currentPit), delay);
    }
  }

  // Send YOUR_TURN to the corresponding bot worker
  function sendBotTurn(botIndex: number) {
    botTurnTimer = null;
    const botWorker = botWorkers[botIndex - 1];
    if (!botWorker || !unoRound || unoRound.hasEnded()) return;

    const msg: MainToWorkerMessage = {
      type: 'YOUR_TURN',
      payload: {
        hand: unoRound.playerHand(botIndex),
        topCard: unoRound.discardPile().top()!,
        currentColor: activeColor.value ?? 'RED',
        drawPileCount: unoRound.drawPile().size,
        playersCardCounts: players.value.map(p => ({
          playerIndex: p.index,
          cardCount: p.cardCount
        })),
        vulnerablePlayerIndex: vulnerablePlayerIndex.value
      }
    };
    botWorker.postMessage(msg);
  }

  function broadcastOpponentAction(actionPlayerIndex: number, vulnerableToUno: boolean) {
    const msg: MainToWorkerMessage = {
      type: 'OPPONENT_ACTION',
      payload: {
        playerIndex: actionPlayerIndex,
        vulnerableToUnoPenalty: vulnerableToUno
      }
    };

    botWorkers.forEach((worker, idx) => {
      // Don't send notification to the actor itself
      if (idx + 1 !== actionPlayerIndex) {
        worker.postMessage(msg);
      }
    });
  }

  // --- Worker Message Receiver ---
  function handleWorkerMessage(msg: WorkerToMainMessage) {
    if (!unoRound || unoRound.hasEnded()) return;

    switch (msg.type) {
      case 'READY':
        break;

      case 'PLAY_CARD': {
        const { playerIndex: botIdx, cardIndex, declaredColor, saidUno } = msg.payload;
        if (playerInTurn.value !== botIdx) return;

        const botName = players.value[botIdx].name;
        const playedCard = unoRound.playerHand(botIdx)[cardIndex];

        if (saidUno) {
          try {
            unoRound.sayUno(botIdx);
            notify(`🗣️ ${botName} shouted "UNO!"`, 'warning', 2500);
            addLog(`${botName} declared UNO!`);
          } catch (e) {
            // Ignore if illegal
          }
        }

        try {
          unoRound.play(cardIndex, declaredColor);
          const colorText = declaredColor ? ` (called ${declaredColor})` : '';
          addLog(`${botName} played ${formatCardName(playedCard)}${colorText}`);

          const isVulnerable = currentVulnerablePlayer() === botIdx;

          if (isVulnerable) {
            notify(`⚠️ ${botName} has 1 card left and DID NOT say UNO!`, 'danger', 4000);
          }

          broadcastOpponentAction(botIdx, isVulnerable);
          advanceTurn();
        } catch (err: any) {
          console.error(`Bot ${botIdx} play error:`, err);
          // If bot made an invalid play, fallback to draw
          unoRound.draw();
          addLog(`${botName} had an invalid move and drew a card.`);
          advanceTurn();
        }
        break;
      }

      case 'DRAW_CARD': {
        const { playerIndex: botIdx } = msg.payload;
        if (playerInTurn.value !== botIdx) return;

        const botName = players.value[botIdx].name;
        unoRound.draw();
        addLog(`${botName} drew a card.`);
        broadcastOpponentAction(botIdx, false);
        advanceTurn();
        break;
      }

      case 'CATCH_UNO': {
        const { accuserIndex, accusedIndex } = msg.payload;
        try {
          const caught = unoRound.catchUnoFailure({
            accuser: accuserIndex,
            accused: accusedIndex
          });

          if (caught) {
            const accuserName = players.value[accuserIndex].name;
            const accusedName = players.value[accusedIndex].name;
            notify(`🚨 ${accuserName} caught ${accusedName} without saying UNO! (+4 penalty cards)`, 'danger', 4000);
            addLog(`🚨 ${accuserName} caught ${accusedName}! 4 penalty cards dealt.`);
            pendingWildIndex.value = null; // Penalty cards can make a Wild Draw 4 illegal
            syncState();
          }
        } catch (err) {
          // Failure if window closed
        }
        break;
      }
    }
  }

  // --- Human Interactions ---
  function humanSayUno() {
    if (!unoRound) return;
    try {
      unoRound.sayUno(humanIndex);
      humanSaidUnoThisTurn.value = true;
      notify('🗣️ You called "UNO!"', 'success', 2500);
      addLog('You declared UNO!');
      syncState();
    } catch (err: any) {
      notify(err.message || 'Cannot declare UNO right now', 'warning');
    }
  }

  function humanPlayCard(cardIndex: number, chosenColor?: Color) {
    if (!unoRound || !isHumanTurn.value) return;

    const card = humanHand.value[cardIndex];

    if (!playableCardIndices.value.has(cardIndex)) {
      notify('That card cannot be played right now', 'warning');
      return;
    }

    // If it's a Wild card and no color chosen yet, prompt user for color
    if ((card.type === 'WILD' || card.type === 'WILD DRAW') && !chosenColor) {
      pendingWildIndex.value = cardIndex;
      return;
    }

    try {
      unoRound.play(cardIndex, chosenColor);
      pendingWildIndex.value = null;

      const colorText = chosenColor ? ` (called ${chosenColor})` : '';
      addLog(`You played ${formatCardName(card)}${colorText}`);

      const isVulnerable = currentVulnerablePlayer() === humanIndex;

      if (isVulnerable) {
        notify('⚠️ You forgot to shout UNO! Opponents can catch you!', 'danger', 3500);
      }

      broadcastOpponentAction(humanIndex, isVulnerable);
      advanceTurn();
    } catch (err: any) {
      notify(err.message || 'Illegal card play', 'danger');
    }
  }

  function cancelWildChoice() {
    pendingWildIndex.value = null;
  }

  function humanDrawCard() {
    if (!unoRound || !canHumanDraw.value) return;
    pendingWildIndex.value = null;
    try {
      const drawn = unoRound.draw();
      addLog(`You drew a card: ${formatCardName(drawn)}`);
      broadcastOpponentAction(humanIndex, false);
      advanceTurn();
    } catch (err: any) {
      notify(err.message || 'Cannot draw card', 'danger');
    }
  }

  function humanCatchUno() {
    if (!unoRound || !canCatchUno.value) return;
    const accused = vulnerablePlayerIndex.value!;
    try {
      const caught = unoRound.catchUnoFailure({
        accuser: humanIndex,
        accused
      });

      if (caught) {
        const accusedName = players.value[accused].name;
        notify(`🎯 Caught ${accusedName}! They draw 4 penalty cards!`, 'success', 4000);
        addLog(`You caught ${accusedName}! 4 penalty cards dealt.`);
        syncState();
      } else {
        notify('Accusation window has expired!', 'warning');
      }
    } catch (err: any) {
      notify(err.message || 'Failed accusation', 'warning');
    }
  }

  // --- Start & Reset Methods ---
  function startGame(playerName: string, botCount: number, mode: GameMode = 'single') {
    gameMode.value = mode;
    const playerNames = [
      playerName.trim() || 'Player',
      ...Array.from({ length: botCount }, (_, i) => `Bot ${i + 1}`)
    ];

    players.value = playerNames.map((name, index) => ({
      index,
      name,
      isBot: index !== 0,
      cardCount: 7,
      score: 0
    }));

    gameLog.value = [];
    roundWinner.value = null;
    roundScore.value = 0;
    matchWinner.value = null;
    pendingWildIndex.value = null;
    humanSaidUnoThisTurn.value = false;
    roundNumber.value = 1;

    spawnBotWorkers(botCount);

    if (mode === 'match') {
      unoGame = new UnoGame(playerNames, targetScore);
      unoRound = unoGame.currentRound() as UnoRound;
    } else {
      unoGame = null;
      unoRound = new UnoRound(playerNames, 0);
    }

    screen.value = 'playing';
    notify(`Game started against ${botCount} ${botCount === 1 ? 'bot' : 'bots'}! Good luck.`, 'info');
    addLog(`Round 1 started. Dealer: ${players.value[unoRound.dealer].name}`);

    syncState();
    advanceTurn();
  }

  function nextRound() {
    if (!unoGame || unoGame.winner() !== undefined) return;

    // UnoGame creates the next round automatically in round.onEnd()
    unoRound = unoGame.currentRound() as UnoRound;

    roundNumber.value++;
    screen.value = 'playing';
    roundWinner.value = null;
    roundScore.value = 0;
    humanSaidUnoThisTurn.value = false;
    pendingWildIndex.value = null;

    addLog(`Next round dealt!`);
    syncState();
    advanceTurn();
  }

  function resetToLobby() {
    terminateBots();
    unoRound = null;
    unoGame = null;
    screen.value = 'lobby';
    players.value = [];
    humanHand.value = [];
    topCard.value = null;
    gameLog.value = [];
    notification.value = null;
  }

  onUnmounted(() => {
    terminateBots();
  });

  return {
    // Navigation & Config
    screen,
    gameMode,
    targetScore,
    players,
    humanIndex,

    // Board State
    playerInTurn,
    humanHand,
    topCard,
    activeColor,
    direction,
    drawPileCount,
    discardPileCount,
    roundNumber,

    // Turn helpers & Flags
    isHumanTurn,
    playableCardIndices,
    canHumanDraw,
    canSayUno,
    canCatchUno,
    vulnerablePlayerIndex,
    pendingWildIndex,
    humanSaidUnoThisTurn,

    // Log & Notifications
    gameLog,
    notification,

    // End Game
    roundWinner,
    roundScore,
    matchWinner,

    // Actions
    startGame,
    nextRound,
    resetToLobby,
    humanPlayCard,
    humanDrawCard,
    humanSayUno,
    humanCatchUno,
    cancelWildChoice
  };
}

// One game instance is shared by every screen: App provides it, screens inject it
export type UnoGameStore = ReturnType<typeof useUnoGame>;
export const unoGameKey: InjectionKey<UnoGameStore> = Symbol('unoGame');

export function injectUnoGame(): UnoGameStore {
  const game = inject(unoGameKey);
  if (!game) {
    throw new Error('useUnoGame store has not been provided');
  }
  return game;
}

// Utility to format card names for logs and messages
export function formatCardName(card: Card): string {
  if (card.type === 'NUMBERED') {
    return `${card.color} ${card.number}`;
  }
  if (card.type === 'SKIP' || card.type === 'REVERSE' || card.type === 'DRAW') {
    const label = card.type === 'DRAW' ? 'Draw 2' : card.type;
    return `${card.color} ${label}`;
  }
  if (card.type === 'WILD') {
    return 'Wild';
  }
  if (card.type === 'WILD DRAW') {
    return 'Wild Draw 4';
  }
  return 'Unknown Card';
}
