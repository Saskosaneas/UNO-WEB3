<template>
  <main class="play">
    <header class="topbar">
      <img v-if="logo" class="brand-image" :src="logo" alt="UNO!" />
      <span v-else class="brand">UNO!</span>
      <span class="round-label">
        <template v-if="gameMode === 'match'">Round {{ roundNumber }} · first to {{ targetScore }}</template>
        <template v-else>Single round</template>
      </span>
      <button class="btn btn-quiet" type="button" @click="resetToLobby">Quit</button>
    </header>

    <div class="layout">
      <div class="table">
        <section class="opponents" aria-label="Opponents">
          <article
            v-for="opponent in opponents"
            :key="opponent.index"
            class="opponent"
            :class="{ 'in-turn': opponent.index === playerInTurn }"
          >
            <div class="opponent-name">
              <img v-if="botAvatar" class="avatar" :src="botAvatar" alt="" />
              <strong>{{ opponent.name }}</strong>
              <span v-if="gameMode === 'match'" class="points">{{ opponent.score }} pts</span>
            </div>
            <div class="fan" aria-hidden="true">
              <UnoCard v-for="n in Math.min(opponent.cardCount, 8)" :key="n" small />
            </div>
            <div class="card-count">
              {{ opponent.cardCount }} {{ opponent.cardCount === 1 ? 'card' : 'cards' }}
            </div>
          </article>
        </section>

        <section class="center" aria-label="Table">
          <div class="pile">
            <button
              class="draw-pile"
              :class="{ prompt: mustDraw }"
              type="button"
              :disabled="!canHumanDraw"
              aria-label="Draw a card"
              @click="humanDrawCard"
            >
              <UnoCard />
            </button>
            <span class="pile-label">Draw · {{ drawPileCount }}</span>
          </div>

          <div class="pile">
            <div :key="discardPileCount" class="discard">
              <UnoCard v-if="topCard" :card="topCard" />
            </div>
            <span class="pile-label">Discard · {{ discardPileCount }}</span>
          </div>

          <div class="state">
            <span v-if="activeColor" class="active-color">
              <img v-if="tokenUrl(activeColor)" :src="tokenUrl(activeColor)" alt="" />
              {{ activeColor }}
            </span>
            <span class="direction">{{ direction === 'clockwise' ? '↻ Clockwise' : '↺ Counterclockwise' }}</span>
          </div>
        </section>

        <section class="actions">
          <p class="status" aria-live="polite">{{ statusText }}</p>
          <div class="action-buttons">
            <button class="btn btn-uno" type="button" :disabled="!canSayUno" @click="humanSayUno">UNO!</button>
            <button v-if="canCatchUno" class="btn btn-catch" type="button" @click="humanCatchUno">
              Catch {{ vulnerableName }}
            </button>
          </div>
        </section>

        <section class="hand-area" :class="{ 'in-turn': isHumanTurn }" aria-label="Your hand">
          <div class="hand-title">
            <div class="player-name">
              <img v-if="playerAvatar" class="avatar" :src="playerAvatar" alt="" />
              <strong>{{ human?.name }}</strong>
            </div>
            <span class="hand-count">
              {{ humanHand.length }} {{ humanHand.length === 1 ? 'card' : 'cards' }}
              <template v-if="gameMode === 'match'"> · {{ human?.score }} pts</template>
            </span>
          </div>
          <div class="hand">
            <UnoCard
              v-for="(card, index) in humanHand"
              :key="index"
              :card="card"
              interactive
              :playable="playableCardIndices.has(index)"
              @click="humanPlayCard(index)"
            />
          </div>
        </section>
      </div>

      <aside class="log panel" aria-label="Game log">
        <h2>Game log</h2>
        <ol>
          <li v-for="(entry, index) in gameLog" :key="gameLog.length - index">{{ entry }}</li>
        </ol>
      </aside>
    </div>

    <div v-if="notification" class="toast" :class="notification.type" role="status">
      {{ notification.text }}
    </div>

    <div v-if="pendingWildIndex !== null" class="overlay" role="dialog" aria-modal="true" aria-label="Choose a color">
      <div class="panel picker">
        <h2>Choose a color</h2>
        <div class="swatches">
          <button
            v-for="color in colors"
            :key="color"
            class="swatch"
            type="button"
            @click="humanPlayCard(pendingWildIndex!, color)"
          >
            <img v-if="tokenUrl(color)" :src="tokenUrl(color)" alt="" />
            {{ color }}
          </button>
        </div>
        <button class="btn btn-quiet" type="button" @click="cancelWildChoice">Cancel</button>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { colors, type Color } from '@/model/deck';
import { injectUnoGame } from '@/composables/useUnoGame';
import { assetUrl } from '@/utils/assets';
import UnoCard from './UnoCard.vue';

const {
  gameMode,
  targetScore,
  roundNumber,
  players,
  humanIndex,
  playerInTurn,
  humanHand,
  topCard,
  activeColor,
  direction,
  drawPileCount,
  discardPileCount,
  isHumanTurn,
  playableCardIndices,
  canHumanDraw,
  canSayUno,
  canCatchUno,
  vulnerablePlayerIndex,
  pendingWildIndex,
  humanSaidUnoThisTurn,
  gameLog,
  notification,
  resetToLobby,
  humanPlayCard,
  humanDrawCard,
  humanSayUno,
  humanCatchUno,
  cancelWildChoice
} = injectUnoGame();

const logo = assetUrl('ui/logo');
const botAvatar = assetUrl('ui/avatar-bot');
const playerAvatar = assetUrl('ui/avatar-player');

function tokenUrl(color: Color) {
  return assetUrl(`ui/color-${color.toLowerCase()}`);
}

const human = computed(() => players.value[humanIndex]);
const opponents = computed(() => players.value.filter(p => p.isBot));
const mustDraw = computed(() => isHumanTurn.value && playableCardIndices.value.size === 0);

const vulnerableName = computed(() => {
  const index = vulnerablePlayerIndex.value;
  return index === null ? '' : players.value[index].name;
});

const statusText = computed(() => {
  if (!isHumanTurn.value) {
    return `${players.value[playerInTurn.value]?.name} is playing…`;
  }
  if (mustDraw.value) return 'No playable card. Draw from the pile.';
  if (humanSaidUnoThisTurn.value) return 'UNO called. Now play your card.';
  if (canSayUno.value) return 'Two cards left: call UNO! before you play.';
  return 'Your turn. Play a highlighted card or draw.';
});
</script>

<style scoped>
.play {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 1rem;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.brand {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
}

.brand-image {
  height: 2rem;
}

.avatar {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  object-fit: cover;
}

.player-name {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.round-label {
  color: var(--muted);
  font-size: 0.9rem;
}

.layout {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 17rem;
  gap: 1rem;
  padding: 1rem;
}

.table {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.opponents {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.opponent {
  flex: 1 1 10rem;
  max-width: 15rem;
  padding: 0.6rem 0.75rem;
  border: 0.15rem solid var(--border);
  border-radius: 0.75rem;
  background: var(--surface);
}

.opponent.in-turn,
.hand-area.in-turn {
  border-color: var(--text);
}

.opponent-name {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
}

.points {
  margin-left: auto;
}

.points,
.card-count {
  font-size: 0.85rem;
  color: var(--muted);
}

.fan {
  display: flex;
  height: 3.1rem;
  margin: 0.4rem 0 0.25rem;
  padding-right: 1.1rem;
}

.fan > * {
  margin-right: -1.1rem;
}

.center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1.5rem 2.5rem;
  padding: 0.5rem;
}

.pile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
}

.pile-label,
.direction,
.status {
  padding: 0.15rem 0.5rem;
  border-radius: 0.3rem;
  background: var(--surface);
}

.pile-label {
  font-size: 0.85rem;
  color: var(--muted);
}

.draw-pile {
  display: block;
  padding: 0;
  border: 0;
  border-radius: 0.8rem;
  background: none;
  color: inherit;
  cursor: pointer;
  transition: transform 0.14s ease;
}

.draw-pile:disabled {
  cursor: not-allowed;
  opacity: 0.75;
}

.draw-pile:not(:disabled):hover {
  transform: translateY(-0.25rem);
}

.draw-pile.prompt {
  outline: 0.2rem solid var(--text);
  outline-offset: 0.15rem;
}

.draw-pile:focus-visible {
  outline: 0.2rem solid var(--text);
  outline-offset: 0.15rem;
}

.discard {
  animation: land 0.2s ease-out;
}

@keyframes land {
  from {
    opacity: 0;
    transform: scale(1.25) rotate(-8deg);
  }
}

.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.active-color {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-width: 6rem;
  border: 1px solid var(--text);
  background: var(--surface);
  padding: 0.35rem 0.8rem;
  border-radius: 999px;
  text-align: center;
  font-weight: 700;
}

.direction {
  font-size: 0.9rem;
  color: var(--muted);
}

.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
}

.status {
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.hand-area {
  padding: 0.6rem 0.75rem 0.85rem;
  border: 0.15rem solid var(--border);
  border-radius: 0.75rem;
  background: var(--surface);
}

.hand-title {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.9rem;
  font-size: 0.95rem;
}

.hand {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.9rem 0.4rem;
}

.log {
  align-self: start;
  position: sticky;
  top: 1rem;
  padding: 0.9rem;
}

.log h2 {
  margin-bottom: 0.5rem;
  font-family: var(--font-display);
  font-size: 1.1rem;
}

.log ol {
  list-style: none;
  max-height: 65vh;
  overflow-y: auto;
  font-size: 0.85rem;
  color: var(--muted);
}

.log li {
  padding: 0.25rem 0;
  border-bottom: 1px solid var(--border);
}

.toast {
  position: fixed;
  z-index: 10;
  top: 3.6rem;
  left: 50%;
  width: max-content;
  max-width: calc(100vw - 2rem);
  padding: 0.6rem 1rem;
  border-radius: 0.5rem;
  transform: translateX(-50%);
  border: 1px solid var(--text);
  background: var(--surface);
  color: var(--text);
  font-weight: 600;
}

.overlay {
  position: fixed;
  z-index: 20;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.5);
}

.picker {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
  max-width: 22rem;
}

.picker h2 {
  font-family: var(--font-display);
}

.swatches {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
  width: 100%;
}

.active-color img,
.swatch img {
  width: 1.25rem;
  height: 1.25rem;
  object-fit: cover;
}

.swatch {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 1.1rem 0.5rem;
  border: 1px solid var(--text);
  background: var(--surface);
  color: var(--text);
  border-radius: 0.6rem;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.swatch:hover {
  background: var(--selected);
}

.swatch:focus-visible {
  outline: 0.2rem solid var(--text);
  outline-offset: 0.1rem;
}

@media (max-width: 900px) {
  .layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .log {
    position: static;
  }

  .log ol {
    max-height: 10rem;
  }
}

@media (max-width: 640px) {
  .layout {
    padding: 0.6rem;
  }

  .opponent {
    flex-basis: 6.5rem;
    padding: 0.4rem 0.5rem;
  }

  .fan {
    display: none;
  }

  .center {
    gap: 1rem 1.5rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .discard {
    animation: none;
  }

  .draw-pile {
    transition: none;
  }
}
</style>
