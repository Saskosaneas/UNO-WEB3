<template>
  <SetupScreen v-if="screen === 'lobby'" />
  <PlayScreen v-else-if="screen === 'playing'" />
  <ResultScreen v-else :key="screen" />
</template>

<script setup lang="ts">
import { provide } from 'vue';
import { unoGameKey, useUnoGame } from '@/composables/useUnoGame';
import { assetUrl } from '@/utils/assets';
import SetupScreen from '@/components/SetupScreen.vue';
import PlayScreen from '@/components/PlayScreen.vue';
import ResultScreen from '@/components/ResultScreen.vue';

const game = useUnoGame();
const { screen } = game;

provide(unoGameKey, game);

const tableImage = assetUrl('ui/table');
if (tableImage) {
  document.body.style.backgroundImage = `url("${tableImage}")`;
}
</script>

<style>
:root {
  --font-display: 'Fredoka', cursive, sans-serif;
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;
  --bg: #e5e5e5;
  --surface: #ffffff;
  --selected: #d4d4d4;
  --border: #a3a3a3;
  --text: #171717;
  --muted: #525252;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-body);
  background: var(--bg) center / cover fixed;
  color: var(--text);
  min-height: 100vh;
}

.center-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.panel {
  padding: 1.75rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
}

.btn {
  padding: 0.7rem 1.2rem;
  border: 1px solid var(--text);
  border-radius: 0.5rem;
  background: var(--text);
  color: var(--surface);
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.btn:hover:not(:disabled) {
  opacity: 0.85;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn:focus-visible {
  outline: 0.2rem solid var(--text);
  outline-offset: 0.12rem;
}

.btn-quiet {
  padding: 0.4rem 0.9rem;
  background: var(--surface);
  color: var(--text);
}

.btn-uno {
  font-size: 1.15rem;
  font-weight: 700;
}
</style>
