import type { Card } from '@/model/deck';

// Every image in "future assets/", see the README there for the expected names
const files = import.meta.glob('/future assets/**/*.{jpg,jpeg,png}', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>;

const urls = new Map(
  Object.entries(files).map(([path, url]) => [
    path.replace('/future assets/', '').replace(/\.\w+$/, '').toLowerCase(),
    url
  ])
);

// Name without extension, e.g. 'cards/red-7'. Undefined until the file is added.
export function assetUrl(name: string): string | undefined {
  return urls.get(name);
}

export function cardAssetName(card: Card): string {
  switch (card.type) {
    case 'NUMBERED':
      return `cards/${card.color.toLowerCase()}-${card.number}`;
    case 'SKIP':
      return `cards/${card.color.toLowerCase()}-skip`;
    case 'REVERSE':
      return `cards/${card.color.toLowerCase()}-reverse`;
    case 'DRAW':
      return `cards/${card.color.toLowerCase()}-draw2`;
    case 'WILD':
      return 'cards/wild';
    case 'WILD DRAW':
      return 'cards/wild-draw4';
  }
}
