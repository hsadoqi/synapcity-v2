import type { FlipCountdownProps } from './flip-countdown.types';
export const LABELS = ['hours', 'minutes', 'seconds'];

export const flipCountdownDemo: FlipCountdownProps = {
  title: 'Doors open in',
  start: '00:15:00',
};

export function parse(start: string): number {
  const [h = 0, m = 0, s = 0] = String(start)
    .split(':')
    .map((p) => Number(p) || 0);
  return Math.max(0, h * 3600 + m * 60 + s);
}

export function pad(n: number): string {
  return String(n).padStart(2, '0');
}

// TODO: Create utils to generate random time for development purposes.
