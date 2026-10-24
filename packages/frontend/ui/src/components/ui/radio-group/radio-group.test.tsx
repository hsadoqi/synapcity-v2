import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Label } from '@synapcity/frontend-ui/core/label';
import {
  RadioGroup,
  RadioGroupItem,
} from '@synapcity/frontend-ui/core/radio-group';

function Example({ onValueChange = vi.fn() }) {
  return (
    <RadioGroup
      aria-label="Notification frequency"
      defaultValue="weekly"
      onValueChange={onValueChange}
    >
      <div>
        <RadioGroupItem id="daily" value="daily" />
        <Label htmlFor="daily">Daily</Label>
      </div>
      <div>
        <RadioGroupItem id="weekly" value="weekly" />
        <Label htmlFor="weekly">Weekly</Label>
      </div>
    </RadioGroup>
  );
}

describe('RadioGroup', () => {
  it('exposes the group and item slots through labelled radio controls', () => {
    render(<Example />);

    expect(
      screen
        .getByRole('radiogroup', { name: 'Notification frequency' })
        .getAttribute('data-slot'),
    ).toBe('radio-group');
    expect(
      screen.getByRole('radio', { name: 'Daily' }).getAttribute('data-slot'),
    ).toBe('radio-group-item');
  });

  it('starts with the default value checked', () => {
    render(<Example />);

    expect(
      screen
        .getByRole('radio', { name: 'Weekly' })
        .getAttribute('aria-checked'),
    ).toBe('true');
    expect(
      screen.getByRole('radio', { name: 'Daily' }).getAttribute('aria-checked'),
    ).toBe('false');
  });

  it('reports a new value selected by the user', () => {
    const onValueChange = vi.fn();
    render(<Example onValueChange={onValueChange} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Daily' }));

    expect(onValueChange).toHaveBeenLastCalledWith('daily', expect.any(Object));
    expect(
      screen.getByRole('radio', { name: 'Daily' }).getAttribute('aria-checked'),
    ).toBe('true');
  });

  it('does not change when an item is disabled', () => {
    const onValueChange = vi.fn();
    render(
      <RadioGroup aria-label="Plan" onValueChange={onValueChange}>
        <RadioGroupItem aria-label="Enterprise" value="enterprise" disabled />
      </RadioGroup>,
    );

    fireEvent.click(screen.getByRole('radio', { name: 'Enterprise' }));

    expect(onValueChange).not.toHaveBeenCalled();
    expect(
      screen
        .getByRole('radio', { name: 'Enterprise' })
        .getAttribute('aria-disabled'),
    ).toBe('true');
  });

  it('forwards invalid semantics to an item', () => {
    render(
      <RadioGroup aria-label="Plan">
        <RadioGroupItem aria-label="Starter" value="starter" aria-invalid />
      </RadioGroup>,
    );

    expect(
      screen
        .getByRole('radio', { name: 'Starter' })
        .getAttribute('aria-invalid'),
    ).toBe('true');
  });
});
