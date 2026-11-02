<template>
  <main class="center-screen">
    <form class="panel setup" @submit.prevent="start">
      <img v-if="logo" class="logo-image" :src="logo" alt="UNO!" />
      <h1 v-else class="logo">UNO!</h1>
      <p class="subtitle">Play in your browser against web worker bots</p>

      <label class="field">
        <span class="field-label">Your name</span>
        <input v-model="playerName" type="text" maxlength="16" placeholder="Player" autocomplete="off" />
      </label>

      <fieldset class="field">
        <legend class="field-label">Opponents</legend>
        <div class="segments">
          <label v-for="count in [1, 2, 3]" :key="count" class="segment" :class="{ active: botCount === count }">
            <input v-model="botCount" type="radio" name="bots" :value="count" />
            {{ count }} {{ count === 1 ? 'bot' : 'bots' }}
          </label>
        </div>
      </fieldset>

      <fieldset class="field">
        <legend class="field-label">Game length</legend>
        <div class="segments">
          <label class="segment" :class="{ active: mode === 'single' }">
            <input v-model="mode" type="radio" name="mode" value="single" />
            Single round
          </label>
          <label class="segment" :class="{ active: mode === 'match' }">
            <input v-model="mode" type="radio" name="mode" value="match" />
            First to {{ targetScore }}
          </label>
        </div>
      </fieldset>

      <button class="btn btn-primary start" type="submit">Deal cards</button>
    </form>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { injectUnoGame, type GameMode } from '@/composables/useUnoGame';
import { assetUrl } from '@/utils/assets';

const { startGame, targetScore } = injectUnoGame();
const logo = assetUrl('ui/logo');

const playerName = ref('');
const botCount = ref(3);
const mode = ref<GameMode>('single');

function start() {
  startGame(playerName.value, botCount.value, mode.value);
}
</script>

<style scoped>
.setup {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
  max-width: 26rem;
}

.logo {
  font-family: var(--font-display);
  font-size: 3.5rem;
  line-height: 1;
  letter-spacing: 2px;
  text-align: center;
  color: var(--text);
}

.logo-image {
  display: block;
  max-width: 100%;
  max-height: 8rem;
  margin: 0 auto;
}

.subtitle {
  margin-top: -0.5rem;
  text-align: center;
  color: var(--muted);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  border: 0;
}

.field-label {
  margin-bottom: 0.4rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--muted);
}

label.field .field-label {
  margin-bottom: 0;
}

input[type='text'] {
  padding: 0.7rem 0.85rem;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  background: var(--surface);
  color: inherit;
  font: inherit;
}

.segments {
  display: flex;
  gap: 0.4rem;
}

.segment {
  flex: 1;
  padding: 0.65rem 0.4rem;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  background: var(--surface);
  text-align: center;
  font-weight: 600;
  cursor: pointer;
}

.segment.active {
  border-color: var(--text);
  background: var(--selected);
}

.segment:focus-within {
  outline: 0.15rem solid var(--text);
  outline-offset: 0.1rem;
}

.segment input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.start {
  margin-top: 0.25rem;
  font-size: 1.15rem;
}
</style>
