import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { FieldRendererProps } from '../../types';
import { DateRangeRenderer } from './date-range-renderer';

const props = (
  extra: Partial<FieldRendererProps> = {},
): FieldRendererProps => ({
  field: { type: 'date-range', name: 'trip', label: 'Trip' },
  id: 'trip',
  value: undefined,
  onChange: vi.fn(),
  onBlur: vi.fn(),
  invalid: false,
  disabled: false,
  required: false,
  ...extra,
});

describe('DateRangeRenderer', () => {
  it('shows the range and posts both ends as name.from and name.to', () => {
    const { container } = render(
      <DateRangeRenderer
        {...props({ value: { from: '2026-01-01', to: '2026-01-05' } })}
      />,
    );

    expect(screen.getByRole('button').textContent).toContain('Jan 01, 2026');
    expect(screen.getByRole('button').textContent).toContain('Jan 05, 2026');
    const hidden = Object.fromEntries(
      [...container.querySelectorAll('input[type="hidden"]')].map((input) => [
        (input as HTMLInputElement).name,
        (input as HTMLInputElement).value,
      ]),
    );
    expect(hidden).toEqual({
      'trip.from': '2026-01-01',
      'trip.to': '2026-01-05',
    });
  });

  it('shows the placeholder for an empty or malformed value', () => {
    render(<DateRangeRenderer {...props({ value: { from: 'soon' } })} />);
    expect(screen.getByRole('button').textContent).toContain(
      'Pick a date range',
    );
  });

  it('emits { from } when a start day is picked', () => {
    const p = props({
      field: {
        type: 'date-range',
        name: 'trip',
        label: 'Trip',
        props: { min: '2026-01-01', max: '2026-01-31' },
      },
    });
    render(<DateRangeRenderer {...p} />);

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('button', { name: /January 10/ }));

    expect(p.onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ from: '2026-01-10' }),
    );
  });

  it('wires id, ARIA, blur and the focus ref to the trigger, and never aria-required', () => {
    const focusRef = { current: null as HTMLElement | null };
    const p = props({
      invalid: true,
      required: true,
      describedBy: 'trip-error',
      focusRef,
    });
    render(<DateRangeRenderer {...p} />);
    const trigger = screen.getByRole('button');

    expect(trigger.id).toBe('trip');
    expect(trigger.getAttribute('aria-invalid')).toBe('true');
    expect(trigger.getAttribute('aria-describedby')).toBe('trip-error');
    expect(trigger.hasAttribute('aria-required')).toBe(false);
    expect(focusRef.current).toBe(trigger);
    fireEvent.blur(trigger);
    expect(p.onBlur).toHaveBeenCalled();
  });
});
