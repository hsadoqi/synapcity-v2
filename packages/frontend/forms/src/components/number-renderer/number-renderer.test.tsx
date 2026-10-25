import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { FieldRendererProps } from '../../types';
import { NumberRenderer } from './number-renderer';

const props = (
  extra: Partial<FieldRendererProps> = {},
): FieldRendererProps => ({
  field: {
    type: 'number',
    name: 'n',
    label: 'N',
    props: { min: 0, max: 10, step: 1 },
  },
  id: 'id-n',
  value: 3,
  onChange: vi.fn(),
  onBlur: vi.fn(),
  invalid: false,
  disabled: false,
  required: false,
  ...extra,
});

describe('NumberRenderer', () => {
  const show = (p: FieldRendererProps) => {
    render(
      <>
        <label htmlFor="id-n">N</label>
        <NumberRenderer {...p} />
      </>,
    );
    return screen.getByLabelText('N') as HTMLInputElement;
  };

  it('shows the number and passes min, max and step', () => {
    const input = show(props());
    expect(input.value).toBe('3');
    expect(input.min).toBe('0');
    expect(input.max).toBe('10');
    expect(input.step).toBe('1');
  });

  it('emits a number', () => {
    const p = props();
    fireEvent.change(show(p), { target: { value: '7' } });
    expect(p.onChange).toHaveBeenCalledWith(7);
  });

  it('emits undefined, not NaN, when cleared', () => {
    const p = props();
    fireEvent.change(show(p), { target: { value: '' } });
    expect(p.onChange).toHaveBeenCalledWith(undefined);
  });

  it('shows 0 as 0 and a non-number as empty', () => {
    expect(show(props({ value: 0 })).value).toBe('0');
  });

  it('shows a non-number value as empty', () => {
    expect(show(props({ value: 'x' })).value).toBe('');
  });

  it('renders a range input that emits a number', () => {
    const p = props({
      field: {
        type: 'range',
        name: 'n',
        label: 'N',
        props: { min: 0, max: 100, step: 5 },
      },
    });
    const input = show(p);
    expect(input.type).toBe('range');
    expect([input.min, input.max, input.step]).toEqual(['0', '100', '5']);
    fireEvent.change(input, { target: { value: '40' } });
    expect(p.onChange).toHaveBeenCalledWith(40);
  });
});
