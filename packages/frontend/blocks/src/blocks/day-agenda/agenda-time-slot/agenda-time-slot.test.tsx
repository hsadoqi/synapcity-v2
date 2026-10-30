import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  AgendaTimeSlot,
  toneClasses,
} from '@/blocks/day-agenda/agenda-time-slot';

describe('AgendaTimeSlot', () => {
  it('renders its time and label as a list item in its tone', () => {
    render(
      <ul>
        <AgendaTimeSlot start="09:00" label="Standup" tone="meeting" />
      </ul>,
    );
    const item = screen.getByRole('listitem');
    expect(item.textContent).toContain('09:00');
    expect(item.textContent).toContain('Standup');
    const fill = screen.getByText('Standup').parentElement!;
    for (const name of toneClasses.meeting.split(' ')) {
      expect(fill.classList.contains(name)).toBe(true);
    }
  });
});
