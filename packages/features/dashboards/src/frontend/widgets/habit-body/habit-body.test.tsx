import { dayKey } from '@synapcity/domain-prototypes';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SEED_NOW, seededWorkspace } from '../../../testing';
import { HabitBody } from './index';

const habit = () => Object.values(seededWorkspace().records.habit)[0]!;

describe('HabitBody', () => {
  it('names each day, marks today, and disables days to come', () => {
    render(<HabitBody habit={habit()} now={SEED_NOW} onToggleDay={() => {}} />);
    expect(screen.getAllByRole('button')).toHaveLength(7);
    expect(
      screen.getByRole('button', { name: 'Friday (today)' }),
    ).toBeDefined();
    expect(
      screen.getByRole('button', { name: 'Saturday' }).hasAttribute('disabled'),
    ).toBe(true);
    expect(
      screen
        .getByRole('button', { name: 'Monday' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
    expect(
      screen
        .getByRole('button', { name: 'Wednesday' })
        .getAttribute('aria-pressed'),
    ).toBe('false');
  });

  it('shows the weekday letters to sight only', () => {
    const { container } = render(
      <HabitBody habit={habit()} now={SEED_NOW} onToggleDay={() => {}} />,
    );
    const letters = [...container.querySelectorAll('[aria-hidden="true"]')].map(
      (el) => el.textContent,
    );
    expect(letters).toEqual(['M', 'T', 'W', 'T', 'F', 'S', 'S']);
  });

  it('toggles a past day by its day key', () => {
    const onToggleDay = vi.fn();
    render(
      <HabitBody habit={habit()} now={SEED_NOW} onToggleDay={onToggleDay} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Wednesday' }));
    expect(onToggleDay).toHaveBeenCalledWith(
      dayKey(new Date(2026, 9, 21).getTime()),
    );
  });
});
