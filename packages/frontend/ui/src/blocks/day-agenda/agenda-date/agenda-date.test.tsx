import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AgendaDate } from '@synapcity/frontend-ui/blocks/day-agenda/agenda-date';

describe('AgendaDate', () => {
  it('formats the date and keeps it machine-readable', () => {
    render(<AgendaDate date="2026-10-24" />);
    const time = screen.getByText('Sat, Oct 24');
    expect(time.tagName).toBe('TIME');
    expect(time.getAttribute('datetime')).toBe('2026-10-24');
  });

  it('takes a locale and format', () => {
    render(
      <AgendaDate
        date="2026-10-24"
        locale="en-GB"
        format={{ day: 'numeric', month: 'long' }}
      />,
    );
    expect(screen.getByText('24 October')).toBeDefined();
  });

  it('shows an invalid date as written, without a datetime', () => {
    render(<AgendaDate date="someday" />);
    const time = screen.getByText('someday');
    expect(time.hasAttribute('datetime')).toBe(false);
  });
});
