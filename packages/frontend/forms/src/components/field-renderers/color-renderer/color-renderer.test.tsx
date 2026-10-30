import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { FieldRendererProps } from '../../../types';
import { ColorRenderer } from './color-renderer';

// The hex values below are field values a person picks, not styling colours.
const props = (
  extra: Partial<FieldRendererProps> = {},
): FieldRendererProps => ({
  field: { type: 'color', name: 'accent', label: 'Accent' },
  id: 'accent',
  value: '',
  onChange: vi.fn(),
  onBlur: vi.fn(),
  invalid: false,
  disabled: false,
  required: false,
  ...extra,
});

const show = (extra: Partial<FieldRendererProps> = {}) => {
  const p = props(extra);
  const view = render(<ColorRenderer {...p} />);
  const input = view.container.querySelector(
    'input[type="color"]',
  ) as HTMLInputElement;
  const hidden = view.container.querySelector(
    'input[type="hidden"]',
  ) as HTMLInputElement;
  return { p, input, hidden };
};

describe('ColorRenderer', () => {
  it('says None chosen and posts nothing while empty', () => {
    const { input, hidden } = show();

    expect(screen.getByText('None chosen')).toBeTruthy();
    expect(input.getAttribute('aria-describedby')).toContain('accent-value');
    expect(input.dataset.empty).toBe('true');
    expect(hidden.name).toBe('accent');
    expect(hidden.value).toBe('');
    expect(input.name).toBe('');
  });

  it('spells out and posts the chosen colour', () => {
    const { hidden } = show({ value: '#336699' });

    expect(screen.getByText('#336699')).toBeTruthy();
    expect(hidden.value).toBe('#336699');
  });

  it('emits the picked colour in lower case', () => {
    const { p, input } = show();

    fireEvent.input(input, { target: { value: '#ABCDEF' } });

    expect(p.onChange).toHaveBeenCalledWith('#abcdef');
  });

  it('offers Clear on an optional field with a colour, which empties it', () => {
    const { p } = show({ value: '#336699' });

    fireEvent.click(screen.getByRole('button', { name: 'Clear Accent' }));

    expect(p.onChange).toHaveBeenCalledWith('');
  });

  it('offers no Clear while empty or when the field is required', () => {
    show();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('offers no Clear on a required field', () => {
    show({ value: '#336699', required: true });
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('treats a value that is not a #rrggbb colour as empty', () => {
    const { hidden } = show({ value: 'red' });
    expect(hidden.value).toBe('');
    expect(screen.getByText('None chosen')).toBeTruthy();
  });

  it('passes invalid, disabled, blur and the focus ref to the input', () => {
    const focusRef = { current: null as HTMLElement | null };
    const { p, input } = show({
      invalid: true,
      disabled: true,
      describedBy: 'accent-error',
      focusRef,
    });

    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(
      'accent-value accent-error',
    );
    expect(input.disabled).toBe(true);
    expect(focusRef.current).toBe(input);
    fireEvent.blur(input);
    expect(p.onBlur).toHaveBeenCalled();
  });

  it('refuses a field of another type', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <ColorRenderer
          {...props({ field: { type: 'text', name: 'a', label: 'A' } })}
        />,
      ),
    ).toThrow('ColorRenderer cannot render a field of type "text"');
    error.mockRestore();
  });
});
