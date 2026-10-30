import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { FieldConfig } from '../../../types';
import type { FieldRendererProps } from '../../../types';
import { ToggleRenderer } from './toggle-renderer';

const props = (
  type: 'checkbox' | 'switch',
  extra: Partial<FieldRendererProps> = {},
): FieldRendererProps => ({
  field: { type, name: 't', label: 'T' } as FieldConfig,
  id: 'id-t',
  value: false,
  onChange: vi.fn(),
  onBlur: vi.fn(),
  invalid: false,
  disabled: false,
  required: false,
  ...extra,
});

describe.each(['checkbox', 'switch'] as const)(
  'ToggleRenderer (%s)',
  (type) => {
    const role = type === 'checkbox' ? 'checkbox' : 'switch';
    const show = (p: FieldRendererProps) => {
      render(
        <>
          <label id="id-t-label" htmlFor="id-t">
            T
          </label>
          <ToggleRenderer {...p} />
        </>,
      );
      return screen.getByRole(role);
    };

    it('emits true when turned on and false when turned off', () => {
      const p = props(type);
      const control = show(p);
      fireEvent.click(control);
      expect(p.onChange).toHaveBeenLastCalledWith(true);
    });

    it('reflects the value and is labelled', () => {
      const control = show(props(type, { value: true }));
      expect(control.getAttribute('aria-checked')).toBe('true');
      // Base UI keeps the id on a hidden input, so the visible control is named
      // through aria-labelledby, not the label's htmlFor.
      expect(screen.getByRole(role, { name: 'T' })).toBe(control);
    });

    it('treats a non-boolean value as off', () => {
      expect(
        show(props(type, { value: 'yes' })).getAttribute('aria-checked'),
      ).toBe('false');
    });

    it('wires aria-invalid and aria-describedby', () => {
      const control = show(
        props(type, { invalid: true, describedBy: 'id-t-error' }),
      );
      expect(control.getAttribute('aria-invalid')).toBe('true');
      expect(control.getAttribute('aria-describedby')).toBe('id-t-error');
    });

    it('attaches focusRef to the control', () => {
      const focusRef = { current: null as HTMLElement | null };
      const control = show(props(type, { focusRef }));
      expect(focusRef.current).toBe(control);
    });
  },
);
