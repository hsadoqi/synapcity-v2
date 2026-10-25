import { act, cleanup, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SimpleCountdown } from './simple-countdown';

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

const time = () => screen.getByRole('timer').textContent;

describe('SimpleCountdown', () => {
  it('shows the time left to a Date', () => {
    render(<SimpleCountdown target={new Date(NOW + 3_725_000)} />);
    expect(time()).toBe('01:02:05');
  });

  it('shows the time left to a timestamp', () => {
    render(<SimpleCountdown target={NOW + 90_000} />);
    expect(time()).toBe('00:01:30');
  });

  it('counts down a second at a time', () => {
    render(<SimpleCountdown target={NOW + 90_000} />);
    advance(10_000);
    expect(time()).toBe('00:01:20');
  });

  it('keeps counting hours past a day', () => {
    render(<SimpleCountdown target={NOW + 100 * 3_600_000} />);
    expect(time()).toBe('100:00:00');
  });

  it('stops at zero', () => {
    render(<SimpleCountdown target={NOW + 2000} />);
    advance(30_000);
    expect(time()).toBe('00:00:00');
  });

  it('shows dashes, not a made-up time, when there is no target', () => {
    render(<SimpleCountdown />);
    expect(time()).toBe('--:--:--');
  });

  it('labels the timer and shows the label', () => {
    render(<SimpleCountdown label="Launches in" target={NOW + 1000} />);
    expect(screen.getByRole('timer', { name: 'Launches in' })).toBeTruthy();
    expect(screen.getByText('Launches in')).toBeTruthy();
  });

  it('renders dashes on the server, whose clock is not the browser’s', () => {
    const text = renderToString(
      <SimpleCountdown target={NOW + 90_000} />,
    ).replace(/<[^>]*>/g, '');
    expect(text).toBe('--:--:--');
  });

  it('does not announce every tick to a screen reader', () => {
    render(<SimpleCountdown target={NOW + 90_000} />);
    expect(screen.getByRole('timer').getAttribute('aria-live')).not.toBe(
      'polite',
    );
  });
});
