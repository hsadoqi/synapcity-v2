import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { FieldRendererProps } from '../../types';
import { RadioGroupRenderer } from './radio-group-renderer';

const props = (
  extra: Partial<FieldRendererProps> = {},
): FieldRendererProps => ({
  field: {
    type: 'radio',
    name: 'frequency',
    label: 'Frequency',
    options: [
      { value: 'daily', label: 'Daily' },
      { value: 'weekly', label: 'Weekly' },
    ],
  },
  id: 'frequency',
  value: 'weekly',
  onChange: vi.fn(),
  onBlur: vi.fn(),
  invalid: false,
  disabled: false,
  required: false,
  ...extra,
});

const renderGroup = (extra: Partial<FieldRendererProps> = {}) => {
  const p = props(extra);
  render(
    <>
      <span id="frequency-label">Frequency</span>
      <RadioGroupRenderer {...p} />
    </>,
  );
  return p;
};

describe('RadioGroupRenderer', () => {
  it('gives the group the field id so the frame label points at a real element', () => {
    renderGroup();

    expect(screen.getByRole('radiogroup').getAttribute('id')).toBe('frequency');
  });

  it('renders every option in a group named by the field label', () => {
    renderGroup();

    expect(screen.getByRole('radiogroup', { name: 'Frequency' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Daily' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Weekly' })).toBeTruthy();
  });

  it('shows the controlled value and emits a selected option', () => {
    const p = renderGroup();
    expect(
      screen
        .getByRole('radio', { name: 'Weekly' })
        .getAttribute('aria-checked'),
    ).toBe('true');

    fireEvent.click(screen.getByRole('radio', { name: 'Daily' }));

    expect(p.onChange).toHaveBeenLastCalledWith('daily');
  });

  it('forwards the form name and interaction state to the group', () => {
    renderGroup({
      invalid: true,
      disabled: true,
      required: true,
      describedBy: 'frequency-help',
    });
    const group = screen.getByRole('radiogroup', { name: 'Frequency' });

    expect(group.getAttribute('aria-invalid')).toBe('true');
    expect(group.getAttribute('aria-required')).toBe('true');
    expect(group.getAttribute('aria-describedby')).toBe('frequency-help');
    expect(
      screen
        .getByRole('radio', { name: 'Daily' })
        .getAttribute('aria-disabled'),
    ).toBe('true');
    expect(
      document.querySelector<HTMLInputElement>('input[name="frequency"]'),
    ).toBeTruthy();
  });

  it('reports blur and gives the form a focus target', () => {
    const focusRef = { current: null as HTMLElement | null };
    const p = renderGroup({ focusRef });
    const first = screen.getByRole('radio', { name: 'Daily' });

    expect(focusRef.current).toBe(first);
    fireEvent.blur(first);
    expect(p.onBlur).toHaveBeenCalled();
  });
});
