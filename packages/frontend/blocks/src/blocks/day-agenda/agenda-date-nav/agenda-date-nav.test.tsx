import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AgendaDateNav } from '@/blocks/day-agenda/agenda-date-nav';

describe('AgendaDateNav', () => {
  it('moves one day back and forward', () => {
    const onDateChange = vi.fn();
    render(<AgendaDateNav date="2026-10-31" onDateChange={onDateChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Next day' }));
    expect(onDateChange).toHaveBeenLastCalledWith('2026-11-01');

    fireEvent.click(screen.getByRole('button', { name: 'Previous day' }));
    expect(onDateChange).toHaveBeenLastCalledWith('2026-10-30');
  });

  it('shows the date on the calendar trigger and jumps to a picked day', async () => {
    const onDateChange = vi.fn();
    render(<AgendaDateNav date="2026-10-24" onDateChange={onDateChange} />);

    const trigger = screen.getByRole('button', { name: /choose a date/i });
    expect(trigger.textContent).toContain('Sat, Oct 24');
    fireEvent.click(trigger);

    const day = await screen.findByRole('button', {
      name: /October 28th, 2026/,
    });
    fireEvent.click(day);
    expect(onDateChange).toHaveBeenLastCalledWith('2026-10-28');
  });

  it('disables the day buttons for an invalid date', () => {
    render(<AgendaDateNav date="someday" onDateChange={vi.fn()} />);
    expect(
      screen
        .getByRole('button', { name: 'Previous day' })
        .hasAttribute('disabled'),
    ).toBe(true);
    expect(
      screen.getByRole('button', { name: 'Next day' }).hasAttribute('disabled'),
    ).toBe(true);
  });
});
