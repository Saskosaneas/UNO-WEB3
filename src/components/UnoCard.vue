<template>
  <component
    :is="interactive ? 'button' : 'div'"
    class="uno-card"
    :class="{ playable, small }"
    :type="interactive ? 'button' : undefined"
    :disabled="interactive && !playable ? true : undefined"
    :aria-label="name"
  >
    <img v-if="image" :src="image" alt="" />
    <span v-else-if="!small" class="placeholder">{{ card ? name : 'UNO' }}</span>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Card } from '@/model/deck';
import { formatCardName } from '@/composables/useUnoGame';
import { assetUrl, cardAssetName } from '@/utils/assets';

const props = defineProps<{
  card?: Card;
  interactive?: boolean;
  playable?: boolean;
  small?: boolean;
}>();

const name = computed(() => (props.card ? formatCardName(props.card) : 'Face-down card'));
const image = computed(() => assetUrl(props.card ? cardAssetName(props.card) : 'cards/back'));
</script>

<style scoped>
.uno-card {
  flex: none;
  width: 5.25rem;
  aspect-ratio: 2 / 3;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 0.25rem;
  border: 1px solid var(--text);
  border-radius: 0.5rem;
  background: var(--surface);
  color: var(--text);
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
}

.uno-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* The art has a transparent margin, so drop the box and let the card shape cast its own shadow */
.uno-card:has(img) {
  padding: 0;
  overflow: visible;
  border: 0;
  background: none;
}

.uno-card:has(img) img {
  transform: scale(1.11);
  filter: drop-shadow(0 0.15rem 0.2rem rgba(0, 0, 0, 0.35));
}

.small {
  width: 1.9rem;
  border-radius: 0.25rem;
}

button.uno-card {
  cursor: not-allowed;
  opacity: 0.5;
  filter: saturate(0.6);
}

button.uno-card.playable {
  cursor: pointer;
  opacity: 1;
  filter: none;
  transform: translateY(-0.5rem);
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

button.uno-card.playable:not(:has(img)) {
  outline: 0.15rem solid var(--text);
}

button.uno-card.playable img {
  filter: drop-shadow(0 0 0.3rem #fde047) drop-shadow(0 0.25rem 0.25rem rgba(0, 0, 0, 0.35));
}

button.uno-card.playable:hover {
  transform: translateY(-1.1rem) rotate(-4deg) scale(1.06);
}

button.uno-card:focus-visible {
  outline: 0.2rem solid var(--text);
  outline-offset: 0.15rem;
}

@media (max-width: 640px) {
  .uno-card:not(.small) {
    width: 3.7rem;
    font-size: 0.68rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  button.uno-card.playable {
    transition: none;
  }
}
</style>
