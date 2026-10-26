import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SimpleCountdown } from '@synapcity/frontend-ui/blocks/simple-countdown';

const NOW = new Date(2026, 9, 25, 12, 0, 0);
const clock = () =>
  screen.getByText((_, el) => el?.getAttribute('aria-live') === 'polite');

describe('SimpleCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it('shows the time left to the target and ticks every second', () => {
    const target = new Date(NOW.getTime() + (3600 + 2 * 60 + 3) * 1000);
    render(<SimpleCountdown label="Launches in" targetDate={target} />);

    expect(screen.getByText('Launches in')).toBeTruthy();
    expect(clock().textContent).toBe('01:02:03');
    act(() => vi.advanceTimersByTime(1000));
    expect(clock().textContent).toBe('01:02:02');
  });

  it('stops at zero once the target has passed', () => {
    render(<SimpleCountdown targetDate={new Date(NOW.getTime() - 5000)} />);

    expect(clock().textContent).toBe('00:00:00');
  });

  it('counts down three hours when given no target, with no label', () => {
    render(<SimpleCountdown />);

    expect(clock().textContent).toBe('03:00:00');
    expect(screen.queryByText('Launches in')).toBeNull();
  });
});
