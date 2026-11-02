import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TimePicker } from '@synapcity/frontend-blocks';

describe('TimePicker', () => {
  it('labels its date and time controls', () => {
    render(<TimePicker />);

    expect(screen.getByRole('button', { name: 'Date' }).textContent).toContain(
      'Select date',
    );
    expect((screen.getByLabelText('Time') as HTMLInputElement).value).toBe(
      '10:30:00',
    );
  });

  it('lets the user edit the time down to seconds', () => {
    render(<TimePicker />);
    const input = screen.getByLabelText('Time') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '14:45:30' } });

    expect(input.value).toBe('14:45:30');
    expect(input.step).toBe('1');
  });

  it('selects a date and closes the calendar', async () => {
    render(<TimePicker />);
    const trigger = screen.getByRole('button', { name: 'Date' });

    fireEvent.click(trigger);
    const grid = await screen.findByRole('grid');
    const day = within(grid)
      .getAllByRole('button')
      .find((button) => !button.hasAttribute('disabled'));
    expect(day).toBeTruthy();

    fireEvent.click(day!);

    expect(trigger.textContent).not.toContain('Select date');
    expect(screen.queryByRole('grid')).toBeNull();
  });
});
