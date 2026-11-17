export interface Tier {
  id: number;
  name: string;
  color: string;
  glow: string;
  emoji: string;
}

export const TIERS: Tier[] = [
  {
    id: 0,
    name: 'Sprout',
    color: '#6ea552',
    glow: '#a7d97a',
    emoji: '🌿',
  },
  {
    id: 1,
    name: 'Mushroom',
    color: '#c47a5a',
    glow: '#e8a07e',
    emoji: '🍄',
  },
  {
    id: 2,
    name: 'Glowing Mushroom',
    color: '#e2b677',
    glow: '#ffd99a',
    emoji: '🌙',
  },
  {
    id: 3,
    name: 'Crystal',
    color: '#6fb4d9',
    glow: '#a8e4ff',
    emoji: '💎',
  },
  {
    id: 4,
    name: 'Fairy',
    color: '#e08fc0',
    glow: '#ffc0e8',
    emoji: '🧚',
  },
  {
    id: 5,
    name: 'Moonbloom',
    color: '#b39ddb',
    glow: '#e6d2ff',
    emoji: '🌸',
  },
];

export const MAX_TIER = TIERS.length - 1;

export function getTier(id: number): Tier | undefined {
  return TIERS[id];
}

export function getTierName(id: number): string {
  return TIERS[id]?.name ?? '—';
}
