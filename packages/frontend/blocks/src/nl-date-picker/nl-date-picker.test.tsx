import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NLDatePicker } from '@/packages/frontend/blocks/src/nl-date-picker';

describe('NLDatePicker', () => {
  it('labels the natural-language input and describes the parsed date', () => {
    render(<NLDatePicker />);

    expect(
      (screen.getByLabelText('Schedule Date') as HTMLInputElement).value,
    ).toBe('In 2 days');
    expect(
      screen.getByText(/Your post will be published on/).textContent,
    ).not.toBe('Your post will be published on .');
  });

  it('updates the preview when the user enters an absolute date', () => {
    render(<NLDatePicker />);

    fireEvent.change(screen.getByLabelText('Schedule Date'), {
      target: { value: 'December 25, 2026' },
    });

    expect(screen.getByText('December 25, 2026')).toBeTruthy();
  });

  it('keeps the last valid preview while an unfinished phrase is edited', () => {
    render(<NLDatePicker />);
    const input = screen.getByLabelText('Schedule Date');

    fireEvent.change(input, { target: { value: 'December 25, 2026' } });
    fireEvent.change(input, { target: { value: 'not a date yet' } });

    expect((input as HTMLInputElement).value).toBe('not a date yet');
    expect(screen.getByText('December 25, 2026')).toBeTruthy();
  });

  it('opens the calendar from the input keyboard shortcut', async () => {
    render(<NLDatePicker />);

    fireEvent.keyDown(screen.getByLabelText('Schedule Date'), {
      key: 'ArrowDown',
    });

    expect(await screen.findByRole('grid')).toBeTruthy();
  });

  it('writes a calendar selection back as a readable date and closes', async () => {
    render(<NLDatePicker />);
    const input = screen.getByLabelText('Schedule Date') as HTMLInputElement;

    fireEvent.click(screen.getByRole('button', { name: 'Select date' }));
    const grid = await screen.findByRole('grid');
    const day = within(grid)
      .getAllByRole('button')
      // The default date is already selected, and clicking it again deselects it.
      .find(
        (button) =>
          !button.hasAttribute('disabled') &&
          !button.closest('[aria-selected="true"]') &&
          !button.hasAttribute('data-selected-single'),
      );
    expect(day).toBeTruthy();

    fireEvent.click(day!);

    await waitFor(() => {
      expect(input.value).toMatch(/^[A-Z][a-z]+ \d{1,2}, \d{4}$/);
      expect(screen.queryByRole('grid')).toBeNull();
    });
  });
});
