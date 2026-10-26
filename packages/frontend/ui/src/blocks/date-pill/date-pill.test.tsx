import { act, cleanup, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const regional = vi.hoisted(() => ({
  formatting: {
    locale: 'en-US',
    timeZone: 'UTC',
    hourCycle: 'h12' as 'h12' | 'h23',
    dateFormat: 'MM/DD/YYYY',
    weekStartsOn: 0,
  },
}));
vi.mock('@synapcity/frontend-preferences', () => ({
  useDateTimeFormatting: () => regional.formatting,
}));

import { DatePill } from './date-pill';

const NOW = Date.UTC(2026, 3, 23, 9, 0);
const VALUE = Date.UTC(2026, 3, 23, 14, 0);
const zone = { locale: 'en-US', timeZone: 'UTC' } as const;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  regional.formatting = {
    ...regional.formatting,
    locale: 'en-US',
    timeZone: 'UTC',
    hourCycle: 'h12',
  };
});

// Intl writes the space before AM/PM as a narrow no-break space in recent ICU versions.
const text = (element: HTMLElement) =>
  (element.textContent ?? '').replace(/\s/g, ' ');

describe('DatePill', () => {
  it('shows the parts it is given as written', () => {
    render(
      <DatePill weekday="Thu" date="Apr 23" time="14:00" relative="Soon" />,
    );
    for (const part of ['Thu', 'Apr 23', '14:00', 'Soon']) {
      expect(screen.getByText(part)).toBeTruthy();
    }
  });

  it('reads the parts from a moment', () => {
    render(<DatePill value={VALUE} {...zone} />);
    for (const part of ['Thu', 'Apr 23', '2:00 PM', 'Today']) {
      expect(
        screen.getByText(part, { normalizer: (s) => s.replace(/\s/g, ' ') }),
      ).toBeTruthy();
    }
  });

  it('marks the moment up as a time element', () => {
    const { container } = render(
      <DatePill value={new Date(VALUE)} {...zone} />,
    );
    expect(container.querySelector('time')?.getAttribute('datetime')).toBe(
      '2026-04-23T14:00:00.000Z',
    );
  });

  it('is not a time element when it only has text', () => {
    const { container } = render(<DatePill date="Apr 23" />);
    expect(container.querySelector('time')).toBeNull();
  });

  it('lets a written part replace the one read from the moment', () => {
    render(<DatePill value={VALUE} {...zone} relative="Kickoff" />);
    expect(screen.getByText('Kickoff')).toBeTruthy();
    expect(screen.queryByText('Today')).toBeNull();
  });

  it('can leave the time out', () => {
    render(<DatePill value={VALUE} {...zone} showTime={false} />);
    expect(screen.queryByText(/PM/)).toBeNull();
    expect(screen.getByText('Apr 23')).toBeTruthy();
  });

  it('moves on from Today when midnight passes', () => {
    vi.setSystemTime(Date.UTC(2026, 3, 23, 23, 59, 58));
    render(<DatePill value={VALUE} {...zone} />);
    expect(screen.getByText('Today')).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText('Yesterday')).toBeTruthy();
  });

  it('shows nothing from the moment for a date that is not real', () => {
    const { container } = render(
      <DatePill value={new Date('nope')} {...zone} />,
    );
    expect(text(container)).toBe('');
  });

  it('reads nothing from the moment on the server, whose clock and zone are not the browser’s', () => {
    const html = renderToString(<DatePill value={VALUE} {...zone} />);
    expect(html).not.toContain('Thu');
    expect(html).not.toContain('PM');
  });

  it("follows the person's language, zone and hour cycle when not told otherwise", () => {
    regional.formatting = {
      ...regional.formatting,
      locale: 'en-GB',
      timeZone: 'Asia/Tokyo',
      hourCycle: 'h23',
    };
    render(<DatePill value={Date.UTC(2026, 3, 23, 23, 30)} />);
    act(() => vi.advanceTimersByTime(0));

    // 23:30 UTC is 08:30 the next morning in Tokyo, written the British way.
    expect(screen.getByText('Fri')).toBeTruthy();
    expect(screen.getByText('24 Apr')).toBeTruthy();
    expect(screen.getByText('08:30')).toBeTruthy();
  });

  it('lets locale and timeZone override the settings', () => {
    regional.formatting = {
      ...regional.formatting,
      locale: 'en-GB',
      timeZone: 'Asia/Tokyo',
    };
    render(<DatePill value={VALUE} locale="en-US" timeZone="UTC" />);
    act(() => vi.advanceTimersByTime(0));

    expect(screen.getByText('Apr 23')).toBeTruthy();
    expect(screen.getByText('Thu')).toBeTruthy();
  });

  it('inverts by re-scoping the theme', () => {
    const { container } = render(<DatePill date="Apr 23" inverted />);
    expect(container.innerHTML).toContain('theme-dark');
  });
});
