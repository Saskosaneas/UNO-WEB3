<template>
  <main class="play">
    <header class="topbar">
      <img v-if="logo" class="brand-image" :src="logo" alt="UNO!" />
      <span v-else class="brand">UNO!</span>
      <span class="round-label">
        <template v-if="gameMode === 'match'">Round {{ roundNumber }} · first to {{ targetScore }}</template>
        <template v-else>Single round</template>
      </span>
      <button class="btn btn-quiet quit" type="button" @click="resetToLobby">Quit</button>
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
            <span v-if="activeColor" class="active-color" :class="activeColor.toLowerCase()">
              <img v-if="tokenUrl(activeColor)" :src="tokenUrl(activeColor)" alt="" />
              {{ activeColor }}
            </span>
            <span class="direction">{{ direction === 'clockwise' ? '↻ Clockwise' : '↺ Counterclockwise' }}</span>
          </div>
        </section>

        <p class="status" aria-live="polite">{{ statusText }}</p>

        <section class="hand-area" :class="{ 'in-turn': isHumanTurn }" aria-label="Your hand">
          <div class="player-badge">
            <img v-if="playerAvatar" class="player-avatar" :src="playerAvatar" alt="" />
            <strong class="player-name">{{ human?.name }}</strong>
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
          <div class="action-buttons">
            <button class="btn btn-uno" type="button" :disabled="!canSayUno" @click="humanSayUno">UNO!</button>
            <button v-if="canCatchUno" class="btn btn-catch" type="button" @click="humanCatchUno">
              Catch {{ vulnerableName }}
            </button>
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
            :class="color.toLowerCase()"
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
  --red: #ef4444;
  --yellow: #facc15;
  --blue: #3b82f6;
  --green: #22c55e;
  --glass: rgba(255, 255, 255, 0.88);
  --glow: #fde047;
  --chunky: 0 0.3rem 0 rgba(0, 0, 0, 0.18), 0 0.6rem 1.4rem rgba(0, 0, 0, 0.18);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.topbar {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.25rem 0;
}

.brand,
.brand-image {
  justify-self: start;
}

.brand {
  font-family: var(--font-display);
  font-size: 2.4rem;
  font-weight: 800;
  color: var(--yellow);
  -webkit-text-stroke: 1.5px var(--text);
  rotate: -6deg;
}

.brand-image {
  height: 4.5rem;
  rotate: -6deg;
  filter: drop-shadow(0 0.3rem 0.4rem rgba(0, 0, 0, 0.45));
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.brand-image:hover {
  transform: rotate(-6deg) scale(1.1);
}

.quit {
  justify-self: end;
  padding: 0.5rem 1.4rem;
  border: 0;
  border-radius: 999px;
  background: #fff;
  color: var(--text);
  font-weight: 700;
  box-shadow: 0 0.25rem 0 rgba(0, 0, 0, 0.25), 0 0.5rem 1rem rgba(0, 0, 0, 0.2);
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s, color 0.2s;
}

.quit:hover:not(:disabled) {
  opacity: 1;
  background: #fee2e2;
  color: #b91c1c;
  transform: translateY(-0.1rem);
}

.quit:active {
  transform: translateY(0.2rem);
  box-shadow: none;
}

.avatar {
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 50%;
  object-fit: cover;
  background: #fff7d6;
  border: 0.15rem solid #fff;
  box-shadow: 0 0 0 0.15rem var(--yellow);
}

.round-label {
  padding: 0.45rem 1.4rem;
  border-radius: 999px;
  background: #fff;
  color: var(--text);
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 700;
  box-shadow: 0 0.25rem 0 rgba(0, 0, 0, 0.25), 0 0.5rem 1rem rgba(0, 0, 0, 0.2);
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
  gap: 0.9rem;
}

.opponent {
  flex: 1 1 10rem;
  max-width: 15rem;
  padding: 0.6rem 0.8rem;
  border: 0.2rem solid transparent;
  border-radius: 1.25rem;
  background: var(--glass);
  backdrop-filter: blur(6px);
  box-shadow: var(--chunky);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.2s;
}

.opponent.in-turn {
  border-color: var(--glow);
  transform: translateY(-0.2rem) scale(1.03);
  box-shadow: 0 0 0 0.3rem rgba(253, 224, 71, 0.35), var(--chunky);
}

.opponent.in-turn .avatar {
  animation: bob 0.9s ease-in-out infinite;
}

@keyframes bob {
  50% {
    transform: translateY(-0.2rem) rotate(-6deg);
  }
}

.opponent-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-display);
}

.points {
  margin-left: auto;
}

.points,
.card-count {
  font-size: 0.85rem;
  color: var(--muted);
}

.card-count {
  font-family: var(--font-display);
}

.fan {
  display: flex;
  height: 3.1rem;
  margin: 0.5rem 0 0.6rem 0.25rem;
  padding-right: 1.1rem;
}

.fan > * {
  margin-right: -1.1rem;
  transform-origin: bottom center;
}

.fan > :nth-child(odd) {
  transform: rotate(-6deg);
}

.fan > :nth-child(even) {
  transform: rotate(5deg) translateY(0.1rem);
}

.center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1.5rem 2.5rem;
  padding: 1.5rem 1rem;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.06) 70%, transparent);
}

.pile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.pile-label,
.direction {
  padding: 0.2rem 0.75rem;
  border-radius: 999px;
  background: var(--glass);
  font-family: var(--font-display);
  font-weight: 600;
  box-shadow: 0 0.15rem 0 rgba(0, 0, 0, 0.15);
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
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.draw-pile:disabled {
  cursor: not-allowed;
  opacity: 0.8;
}

.draw-pile:not(:disabled):hover {
  transform: translateY(-0.35rem) rotate(-3deg);
}

.draw-pile.prompt {
  animation: wiggle 1.2s ease-in-out infinite;
  filter: drop-shadow(0 0 0.6rem var(--glow));
}

@keyframes wiggle {
  0%, 60%, 100% {
    transform: rotate(0);
  }
  70% {
    transform: rotate(-5deg) scale(1.04);
  }
  80% {
    transform: rotate(5deg) scale(1.04);
  }
  90% {
    transform: rotate(-3deg);
  }
}

.draw-pile:focus-visible {
  outline: 0.2rem solid var(--glow);
  outline-offset: 0.2rem;
}

.discard {
  animation: land 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes land {
  from {
    opacity: 0;
    transform: translateY(-1.5rem) scale(1.3) rotate(-14deg);
  }
}

.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.active-color {
  --tint: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-width: 7rem;
  padding: 0.35rem 1rem 0.35rem 0.4rem;
  border: 0.2rem solid var(--tint);
  border-radius: 999px;
  background: #fff;
  color: var(--tint);
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 700;
  text-transform: capitalize;
  box-shadow: 0 0.25rem 0 var(--tint);
  animation: pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.red { --tint: #dc2626; }
.yellow { --tint: #ca8a04; }
.blue { --tint: #2563eb; }
.green { --tint: #16a34a; }

@keyframes pop {
  from {
    transform: scale(0.6);
  }
}

.direction {
  font-size: 0.9rem;
  color: var(--muted);
}

.status {
  position: relative;
  align-self: flex-start;
  margin-left: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  background: var(--glass);
  font-family: var(--font-display);
  font-weight: 600;
  box-shadow: var(--chunky);
}

/* little speech-bubble tail pointing at the player's avatar */
.status::after {
  content: '';
  position: absolute;
  left: 3.5rem;
  bottom: -0.45rem;
  border: 0.5rem solid transparent;
  border-bottom: 0;
  border-top-color: var(--glass);
}

.action-buttons {
  grid-area: actions;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.btn-uno,
.btn-catch {
  border: 0;
  border-radius: 999px;
  font-family: var(--font-display);
  font-weight: 800;
  letter-spacing: 0.03em;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.btn-uno {
  padding: 0.7rem 1.6rem;
  background: var(--red);
  color: var(--yellow);
  font-size: 1.3rem;
  -webkit-text-stroke: 0.5px #7f1d1d;
  box-shadow: 0 0.3rem 0 #991b1b, 0 0.5rem 1rem rgba(0, 0, 0, 0.25);
}

.btn-uno:not(:disabled) {
  animation: throb 1s ease-in-out infinite;
}

@keyframes throb {
  50% {
    transform: scale(1.08) rotate(-2deg);
  }
}

.btn-catch {
  background: var(--yellow);
  color: var(--text);
  box-shadow: 0 0.3rem 0 #a16207, 0 0.5rem 1rem rgba(0, 0, 0, 0.25);
}

.btn-uno:not(:disabled):active,
.btn-catch:active {
  transform: translateY(0.2rem);
  box-shadow: none;
}

.hand-area {
  display: grid;
  grid-template-columns: 9rem minmax(0, 1fr) 9rem;
  grid-template-areas: 'badge hand actions';
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border: 0.2rem solid transparent;
  border-radius: 1.5rem;
  background: var(--glass);
  backdrop-filter: blur(6px);
  box-shadow: var(--chunky);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.hand-area.in-turn {
  border-color: var(--glow);
  box-shadow: 0 0 0 0.35rem rgba(253, 224, 71, 0.35), var(--chunky);
}

.player-badge {
  grid-area: badge;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
  text-align: center;
}

.player-avatar {
  width: 5.5rem;
  height: 5.5rem;
  border-radius: 50%;
  object-fit: cover;
  background: #fff7d6;
  border: 0.25rem solid #fff;
  box-shadow: 0 0 0 0.25rem var(--yellow), 0 0.4rem 0.8rem rgba(0, 0, 0, 0.25);
  transition: box-shadow 0.2s;
}

.hand-area.in-turn .player-avatar {
  animation: bob 0.9s ease-in-out infinite;
  box-shadow: 0 0 0 0.25rem var(--glow), 0 0 1.2rem 0.4rem rgba(253, 224, 71, 0.75);
}

.player-name {
  max-width: 100%;
  font-family: var(--font-display);
  font-size: 1.2rem;
  overflow-wrap: anywhere;
}

.hand-count {
  padding: 0.2rem 0.75rem;
  border-radius: 999px;
  background: #fff7d6;
  font-family: var(--font-display);
  font-weight: 600;
}

.hand {
  grid-area: hand;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.9rem 0.4rem;
  padding-top: 0.6rem;
}

.log {
  align-self: start;
  position: sticky;
  top: 1rem;
  padding: 1rem;
  border: 0;
  border-radius: 1.25rem;
  background: var(--glass);
  backdrop-filter: blur(6px);
  box-shadow: var(--chunky);
}

.log h2 {
  margin-bottom: 0.5rem;
  font-family: var(--font-display);
  font-size: 1.15rem;
}

.log ol {
  list-style: none;
  max-height: 65vh;
  overflow-y: auto;
  font-size: 0.85rem;
  color: var(--muted);
}

.log li {
  position: relative;
  padding: 0.3rem 0 0.3rem 1rem;
  border-bottom: 1px dashed var(--border);
}

.log li::before {
  content: '';
  position: absolute;
  left: 0.15rem;
  top: 0.7rem;
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  background: var(--border);
}

.log li:first-child {
  color: var(--text);
  font-weight: 600;
}

.log li:first-child::before {
  background: var(--red);
}

.toast {
  position: fixed;
  z-index: 10;
  top: 6rem;
  left: 50%;
  width: max-content;
  max-width: calc(100vw - 2rem);
  padding: 0.65rem 1.2rem;
  border: 0.2rem solid var(--yellow);
  border-radius: 999px;
  translate: -50% 0;
  background: #fff;
  color: var(--text);
  font-family: var(--font-display);
  font-weight: 700;
  box-shadow: var(--chunky);
  animation: drop-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes drop-in {
  from {
    opacity: 0;
    transform: translateY(-1.5rem) scale(0.8);
  }
}

.overlay {
  position: fixed;
  z-index: 20;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(3px);
}

.picker {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
  max-width: 22rem;
  border: 0;
  border-radius: 1.5rem;
  box-shadow: var(--chunky);
  animation: pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.picker h2 {
  font-family: var(--font-display);
}

.swatches {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  width: 100%;
}

.active-color img {
  width: 1.6rem;
  height: 1.6rem;
}

.swatch img {
  width: 2.2rem;
  height: 2.2rem;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.swatch {
  --tint: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.9rem 0.5rem;
  border: 0.2rem solid var(--tint);
  border-radius: 1rem;
  background: #fff;
  color: var(--tint);
  font: inherit;
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 700;
  text-transform: capitalize;
  cursor: pointer;
  box-shadow: 0 0.25rem 0 var(--tint);
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.swatch:hover {
  transform: translateY(-0.2rem);
}

.swatch:hover img {
  transform: rotate(180deg) scale(1.15);
}

.swatch:active {
  transform: translateY(0.2rem);
  box-shadow: none;
}

.swatch:focus-visible {
  outline: 0.2rem solid var(--text);
  outline-offset: 0.15rem;
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
  .topbar {
    padding: 0.5rem 0.75rem 0;
  }

  .brand-image {
    height: 3rem;
  }

  .round-label {
    padding: 0.35rem 0.9rem;
    font-size: 0.9rem;
  }

  .hand-area {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas: 'badge actions' 'hand hand';
    padding: 0.75rem;
  }

  .player-badge {
    flex-direction: row;
    flex-wrap: wrap;
    text-align: left;
  }

  .player-avatar {
    width: 3.25rem;
    height: 3.25rem;
  }

  .status {
    margin-left: 0;
  }

  .status::after {
    left: 1.5rem;
  }

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
  .play *,
  .play *::before,
  .play *::after {
    animation: none !important;
    transition: none !important;
  }
}
</style>
