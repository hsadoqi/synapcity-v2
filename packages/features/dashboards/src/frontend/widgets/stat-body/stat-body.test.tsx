import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { regionalDefaults } from '@synapcity/domain-preferences';
import { RegionalProvider } from '@synapcity/frontend-preferences';
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

  it("writes the value in the person's number format", () => {
    const metric = {
      ...Object.values(seededWorkspace().records.metric)[0]!,
      value: 1234567.5,
    };
    render(
      <RegionalProvider
        regional={{ ...regionalDefaults, numberFormat: '1.000,00' }}
        deviceTimeZone={null}
      >
        <StatBody metric={metric} />
      </RegionalProvider>,
    );
    expect(screen.getByText('1.234.567,5')).toBeDefined();
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
