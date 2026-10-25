import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FlipCountdown } from './flip-countdown';
import { FlipDigit } from './flip-countdown-digit';

const NOW = Date.parse('2026-10-25T10:00:00.000Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

/** The time as a screen reader gets it; the flipping digits are hidden from it. */
const time = () => screen.getByText(/^\d+:\d{2}:\d{2}$/).textContent;

describe('FlipCountdown', () => {
  it('starts from the start duration', () => {
    render(<FlipCountdown start="00:15:00" />);
    expect(time()).toBe('00:15:00');
  });

  it('counts down a second at a time', () => {
    render(<FlipCountdown start="00:15:00" />);
    advance(5000);
    expect(time()).toBe('00:14:55');
  });

  it('holds at zero, then starts over', () => {
    render(<FlipCountdown start="00:00:03" holdMs={2500} />);
    advance(3000);
    expect(time()).toBe('00:00:00');
    advance(2000);
    expect(time()).toBe('00:00:00');
    advance(1000);
    expect(time()).toBe('00:00:03');
  });

  it('falls back to fifteen minutes when there is no start', () => {
    render(<FlipCountdown />);
    expect(time()).toBe('00:15:00');
  });

  it('falls back to fifteen minutes for a start it cannot read', () => {
    render(<FlipCountdown start="soon" />);
    expect(time()).toBe('00:15:00');
  });

  it('counts down once to a target and stays at zero', () => {
    render(<FlipCountdown target={NOW + 90_000} />);
    expect(time()).toBe('00:01:30');
    advance(90_000);
    expect(time()).toBe('00:00:00');
    advance(30_000);
    expect(time()).toBe('00:00:00');
  });

  it('prefers a target to a start', () => {
    render(<FlipCountdown start="00:15:00" target={new Date(NOW + 60_000)} />);
    expect(time()).toBe('00:01:00');
  });

  it('names the timer after its title and shows the caption', () => {
    render(<FlipCountdown title="Doors open in" caption="Party time!" />);
    expect(screen.getByRole('timer', { name: 'Doors open in' })).toBeTruthy();
    expect(screen.getByText('Party time!')).toBeTruthy();
  });

  it('renders no time on the server, whose clock is not the browser’s', () => {
    expect(renderToString(<FlipCountdown start="00:15:00" />)).not.toMatch(
      /\d{2}:\d{2}:\d{2}/,
    );
  });
});

describe('FlipDigit', () => {
  const flaps = (container: HTMLElement) =>
    container.querySelectorAll('[data-flap]');

  // jsdom has no AnimationEvent, so React listens for the prefixed name there; a browser
  // uses the plain one. Firing both reaches the handler either way.
  const endAnimation = (element: Element) => {
    fireEvent.animationEnd(element);
    fireEvent(element, new Event('webkitAnimationEnd', { bubbles: true }));
  };

  it('shows the digit with no fold at first', () => {
    const { container } = render(<FlipDigit value="1" />);
    expect(flaps(container)).toHaveLength(0);
    expect(container.textContent).toBe('11');
  });

  it('folds from the old digit to the new one, then settles on the new one', () => {
    const { container, rerender } = render(<FlipDigit value="1" />);
    rerender(<FlipDigit value="2" />);

    // Top and bottom halves, then the two folding halves: the bottom half keeps the
    // old digit until the fold lands.
    expect(flaps(container)).toHaveLength(2);
    expect(container.textContent).toBe('2112');

    endAnimation(container.querySelector('[data-flap="bottom"]')!);
    expect(flaps(container)).toHaveLength(0);
    expect(container.textContent).toBe('22');
  });
});
