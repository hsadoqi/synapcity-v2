import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { seededWorkspace } from '../../../testing';
import { StatBody } from './index';

describe('StatBody', () => {
  it('shows the value, unit and comparison', () => {
    const metric = Object.values(seededWorkspace().records.metric)[0]!;
    render(<StatBody metric={metric} />);
    expect(screen.getByText('4')).toBeDefined();
    expect(screen.getByText('sessions logged')).toBeDefined();
    expect(screen.getByText('+1 vs last week')).toBeDefined();
  });

  it('commits a finite value on blur', () => {
    const metric = Object.values(seededWorkspace().records.metric)[0]!;
    const onValueChange = vi.fn();
    render(<StatBody metric={metric} onValueChange={onValueChange} />);
    const input = screen.getByRole('spinbutton', {
      name: `${metric.name} value`,
    });

    fireEvent.change(input, { target: { value: '9' } });
    fireEvent.blur(input);

    expect(onValueChange).toHaveBeenCalledWith(9);
  });

  it('restores the saved value after an empty draft', () => {
    const metric = Object.values(seededWorkspace().records.metric)[0]!;
    const onValueChange = vi.fn();
    render(<StatBody metric={metric} onValueChange={onValueChange} />);
    const input = screen.getByRole('spinbutton', {
      name: `${metric.name} value`,
    });

    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);

    expect(onValueChange).not.toHaveBeenCalled();
    expect(input).toHaveProperty('value', String(metric.value));
  });
});
