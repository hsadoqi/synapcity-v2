import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { FieldRendererProps } from '../../types';
import { DatePickerRenderer } from './date-picker-renderer';

const props = (
  extra: Partial<FieldRendererProps> = {},
): FieldRendererProps => ({
  field: {
    type: 'date',
    name: 'due',
    label: 'Due date',
    props: { min: '2026-05-03', max: '2026-05-20' },
  },
  id: 'due',
  value: '2026-05-04',
  onChange: vi.fn(),
  onBlur: vi.fn(),
  invalid: false,
  disabled: false,
  required: false,
  ...extra,
});

const renderPicker = (extra: Partial<FieldRendererProps> = {}) => {
  const p = props(extra);
  render(
    <>
      <label htmlFor="due">Due date</label>
      <DatePickerRenderer {...p} />
    </>,
  );
  return p;
};

describe('DatePickerRenderer', () => {
  it('adapts a yyyy-MM-dd field value to the calendar without a timezone shift', () => {
    const p = renderPicker();
    const trigger = screen.getByRole('button', { name: 'Due date' });

    expect(trigger.textContent).toContain('May 4th, 2026');
    expect(
      document.querySelector<HTMLInputElement>('input[name="due"]')?.value,
    ).toBe('2026-05-04');
    expect(p.onChange).not.toHaveBeenCalled();
  });

  it('emits the schema string when a day is chosen', async () => {
    const p = renderPicker();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Due date' }));
    });
    await act(async () => {
      fireEvent.click(
        await screen.findByRole('button', { name: /May 11th, 2026/ }),
      );
    });

    expect(p.onChange).toHaveBeenLastCalledWith('2026-05-11');
  });

  it('shows an empty picker for an absent or malformed value', () => {
    const { rerender } = render(
      <DatePickerRenderer {...props({ value: undefined })} />,
    );
    expect(screen.getByRole('button').textContent).toContain('Pick a date');

    rerender(<DatePickerRenderer {...props({ value: '2026-02-31' })} />);
    expect(screen.getByRole('button').textContent).toContain('Pick a date');
  });

  it('passes bounds, state, ARIA, blur and focus ref to the picker', async () => {
    const focusRef = { current: null as HTMLElement | null };
    const p = renderPicker({
      field: {
        type: 'date',
        name: 'due',
        label: 'Due date',
        props: { min: '2026-05-03', max: '2026-05-20', step: 7 },
      },
      invalid: true,
      disabled: false,
      required: true,
      describedBy: 'due-help',
      focusRef,
    });
    const trigger = screen.getByRole('button', { name: 'Due date' });

    expect(focusRef.current).toBe(trigger);
    expect(trigger.getAttribute('aria-invalid')).toBe('true');
    // A button cannot be aria-required; the form's validation owns the rule.
    expect(trigger.hasAttribute('aria-required')).toBe(false);
    expect(trigger.getAttribute('aria-describedby')).toBe('due-help');
    fireEvent.blur(trigger);
    expect(p.onBlur).toHaveBeenCalledTimes(1);

    await act(async () => fireEvent.click(trigger));
    expect(
      (
        await screen.findByRole('button', { name: /May 2nd, 2026/ })
      ).hasAttribute('disabled'),
    ).toBe(true);
    expect(
      screen
        .getByRole('button', { name: /May 21st, 2026/ })
        .hasAttribute('disabled'),
    ).toBe(true);
    expect(
      screen
        .getByRole('button', { name: /May 4th, 2026/ })
        .hasAttribute('disabled'),
    ).toBe(true);
    expect(
      screen
        .getByRole('button', { name: /May 10th, 2026/ })
        .hasAttribute('disabled'),
    ).toBe(false);
  });
});
