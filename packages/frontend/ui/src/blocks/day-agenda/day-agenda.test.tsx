import { beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { TimeSlot } from './day-agenda.types';
import { DayAgenda } from './day-agenda';

const startTime = new Date().toLocaleTimeString([], {
  hour: '2-digit',
  minute: '2-digit',
});
const sampleTimeSlots: TimeSlot[] = [
  { start: startTime, label: 'API refactor', tone: 'focus' },
  { start: startTime, label: 'Standup', tone: 'meeting' },
  { start: startTime, label: 'Lunch', tone: 'break' },
  { start: startTime, label: 'Email & admin', tone: 'admin' },
];

describe('DayAgenda', () => {
  beforeEach(() => {
    render(
      <DayAgenda
        date="2026-10-24"
        slots={sampleTimeSlots}
        surface="card"
        bordered={false}
      />,
    );
  });
  test('renders the date and TimeSlots correctly', () => {
    // Check if the date is rendered
    const dateElement = screen.getByText('Sat, Oct 24');
    expect(dateElement).toBeDefined();

    // Check if all TimeSlots are rendered
    sampleTimeSlots.forEach((timeSlot) => {
      const timeSlotElement = screen.getByText(timeSlot.label);
      expect(timeSlotElement).toBeDefined();
    });
  });
});

describe('DayAgenda date navigation', () => {
  beforeEach(cleanup);

  test('shows plain text without onDateChange', () => {
    render(<DayAgenda date="2026-10-24" slots={[]} />);
    expect(screen.queryByRole('button', { name: 'Next day' })).toBeNull();
    expect(screen.getByText('Sat, Oct 24').tagName).toBe('TIME');
  });

  test('reports the next day through onDateChange', () => {
    const onDateChange = vi.fn();
    render(
      <DayAgenda date="2026-10-24" slots={[]} onDateChange={onDateChange} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Next day' }));
    expect(onDateChange).toHaveBeenCalledWith('2026-10-25');
  });
});

describe('DayAgenda empty state', () => {
  beforeEach(cleanup);

  test('shows the empty content when there are no slots', () => {
    render(
      <DayAgenda
        date="2026-10-24"
        slots={[]}
        empty={<p>Nothing scheduled.</p>}
      />,
    );
    expect(screen.getByText('Nothing scheduled.')).toBeDefined();
    expect(screen.queryByRole('list')).toBeNull();
  });

  test('ignores the empty content when there are slots', () => {
    render(
      <DayAgenda
        date="2026-10-24"
        slots={[{ start: '09:00', label: 'Standup', tone: 'meeting' }]}
        empty={<p>Nothing scheduled.</p>}
      />,
    );
    expect(screen.queryByText('Nothing scheduled.')).toBeNull();
  });
});
