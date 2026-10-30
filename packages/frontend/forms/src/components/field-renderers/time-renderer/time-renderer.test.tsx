import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { FieldRendererProps } from '../../../../types';
import { TimeRenderer } from './time-renderer';

const props = (
  extra: Partial<FieldRendererProps> = {},
  fieldProps: Record<string, unknown> = {},
): FieldRendererProps => ({
  field: { type: 'time', name: 'at', label: 'Reminder', props: fieldProps },
  id: 'at',
  value: '',
  onChange: vi.fn(),
  onBlur: vi.fn(),
  invalid: false,
  disabled: false,
  required: false,
  ...extra,
});

const show = (
  extra: Partial<FieldRendererProps> = {},
  fieldProps: Record<string, unknown> = {},
) => {
  const p = props(extra, fieldProps);
  const view = render(<TimeRenderer {...p} />);
  const input = view.container.querySelector('input') as HTMLInputElement;
  return { p, input };
};

describe('TimeRenderer', () => {
  it('shows a valid time and posts it under the field name', () => {
    const { input } = show({ value: '09:30' });
    expect(input.type).toBe('time');
    expect(input.value).toBe('09:30');
    expect(input.name).toBe('at');
  });

  it('shows an unusable value as empty', () => {
    const { input } = show({ value: 'late' });
    expect(input.value).toBe('');
  });

  it('emits what the control gives', () => {
    const { p, input } = show();
    fireEvent.change(input, { target: { value: '14:05' } });
    expect(p.onChange).toHaveBeenCalledWith('14:05');
  });

  it('passes min, max and step to the control', () => {
    const { input } = show({}, { min: '08:00', max: '18:00', step: 900 });
    expect(input.min).toBe('08:00');
    expect(input.max).toBe('18:00');
    expect(input.step).toBe('900');
  });

  it('offers Clear on an optional field with a time, which empties it', () => {
    const { p } = show({ value: '09:30' });
    fireEvent.click(screen.getByRole('button', { name: 'Clear Reminder' }));
    expect(p.onChange).toHaveBeenCalledWith('');
  });

  it('offers no Clear while empty', () => {
    show();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('offers no Clear on a required field', () => {
    show({ value: '09:30', required: true });
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('wires ARIA, blur and the focus ref to the control', () => {
    const focusRef = { current: null as HTMLElement | null };
    const { p, input } = show({
      invalid: true,
      required: true,
      describedBy: 'at-error',
      focusRef,
    });

    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('at-error');
    expect(focusRef.current).toBe(input);
    fireEvent.blur(input);
    expect(p.onBlur).toHaveBeenCalled();
  });

  it('refuses a field of another type', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <TimeRenderer
          {...props({ field: { type: 'text', name: 'a', label: 'A' } })}
        />,
      ),
    ).toThrow('TimeRenderer cannot render a field of type "text"');
    error.mockRestore();
  });
});
