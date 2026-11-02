<template>
  <main class="center-screen">
    <section class="panel result">
      <h1>{{ title }}</h1>
      <p class="summary">{{ summary }}</p>

      <table>
        <thead>
          <tr>
            <th scope="col">Player</th>
            <th scope="col">Cards left</th>
            <th scope="col">Score</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="player in standings" :key="player.index" :class="{ winner: player.index === roundWinner?.index }">
            <th scope="row">{{ player.name }}</th>
            <td>{{ player.cardCount }}</td>
            <td>{{ player.score }}</td>
          </tr>
        </tbody>
      </table>

      <div class="buttons">
        <button v-if="screen === 'round_over'" class="btn btn-primary" type="button" @click="nextRound">
          Next round
        </button>
        <button class="btn" :class="screen === 'round_over' ? 'btn-quiet' : 'btn-primary'" type="button" @click="resetToLobby">
          {{ screen === 'round_over' ? 'Quit match' : 'New game' }}
        </button>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import confetti from 'canvas-confetti';
import { injectUnoGame } from '@/composables/useUnoGame';

const {
  screen,
  gameMode,
  targetScore,
  players,
  humanIndex,
  roundWinner,
  roundScore,
  matchWinner,
  nextRound,
  resetToLobby
} = injectUnoGame();

const standings = computed(() => [...players.value].sort((a, b) => b.score - a.score));

const title = computed(() => {
  if (screen.value === 'round_over') return 'Round over';
  return matchWinner.value?.index === humanIndex ? 'You won!' : 'Game over';
});

const summary = computed(() => {
  const name = roundWinner.value?.name;
  if (gameMode.value === 'match' && screen.value === 'game_over') {
    return `${matchWinner.value?.name} reached ${targetScore} points and won the match.`;
  }
  return `${name} won the round and scored ${roundScore.value} points.`;
});

onMounted(() => {
  const humanWon = screen.value === 'game_over' && matchWinner.value?.index === humanIndex;
  if (humanWon) {
    confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 }, colors: ['#171717', '#a3a3a3'], disableForReducedMotion: true });
  }
});
</script>

<style scoped>
.result {
  width: 100%;
  max-width: 30rem;
  text-align: center;
}

h1 {
  font-family: var(--font-display);
  font-size: 2.5rem;
  color: var(--text);
}

.summary {
  margin: 0.5rem 0 1.25rem;
  color: var(--muted);
}

table {
  width: 100%;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}

th,
td {
  padding: 0.55rem 0.5rem;
  border-bottom: 1px solid var(--border);
  text-align: right;
}

th:first-child {
  text-align: left;
}

thead th {
  font-size: 0.85rem;
  color: var(--muted);
}

tr.winner th,
tr.winner td {
  color: var(--text);
  font-weight: 700;
}

.buttons {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 1.5rem;
}
</style>
