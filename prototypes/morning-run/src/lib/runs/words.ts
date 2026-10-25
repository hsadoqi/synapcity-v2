import type { WordSet } from './schema';

const SCALE_WORDS = [
  'Very low',
  'Very low',
  'Low',
  'Low',
  'Steady',
  'Steady',
  'Good',
  'Good',
  'Great',
  'Great',
] as const;

const ENERGY_WORDS = [
  'Running on fumes',
  'Running on fumes',
  'A bit low',
  'A bit low',
  'Steady',
  'Steady',
  'Pretty good',
  'Pretty good',
  'Buzzing',
  'Buzzing',
] as const;

const WORDS: Record<WordSet, readonly string[]> = {
  general: SCALE_WORDS,
  energy: ENERGY_WORDS,
};

export function wordFor(set: WordSet, rating: number): string {
  return WORDS[set][rating - 1] ?? '';
}
