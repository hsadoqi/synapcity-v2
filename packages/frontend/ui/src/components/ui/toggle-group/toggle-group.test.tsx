import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  ToggleGroup,
  ToggleGroupItem,
} from '@synapcity/frontend-ui/core/toggle-group';

const renderGroup = (props = {}) =>
  render(
    <ToggleGroup aria-label="Alignment" {...props}>
      <ToggleGroupItem value="left" aria-label="Left" />
      <ToggleGroupItem value="right" aria-label="Right" />
    </ToggleGroup>,
  );

describe('ToggleGroup', () => {
  it('marks the group and each item with their slots', () => {
    renderGroup();

    expect(screen.getByRole('group').getAttribute('data-slot')).toBe(
      'toggle-group',
    );
    expect(
      screen.getByRole('button', { name: 'Left' }).getAttribute('data-slot'),
    ).toBe('toggle-group-item');
  });

  it('exposes variant, size, spacing and orientation to styling', () => {
    renderGroup({ variant: 'outline', size: 'sm', spacing: 0 });
    const group = screen.getByRole('group');

    expect(group.getAttribute('data-variant')).toBe('outline');
    expect(group.getAttribute('data-size')).toBe('sm');
    expect(group.getAttribute('data-spacing')).toBe('0');
    expect(group.getAttribute('data-orientation')).toBe('horizontal');
  });

  it('passes the group variant down to its items', () => {
    renderGroup({ variant: 'outline' });

    expect(
      screen.getByRole('button', { name: 'Left' }).getAttribute('data-variant'),
    ).toBe('outline');
  });

  it('selects a single item and reports the value', () => {
    const onValueChange = vi.fn();
    renderGroup({ onValueChange });
    fireEvent.click(screen.getByRole('button', { name: 'Left' }));

    expect(onValueChange).toHaveBeenCalledWith(['left'], expect.any(Object));
    expect(
      screen.getByRole('button', { name: 'Left' }).getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('allows several pressed items with multiple', () => {
    renderGroup({ multiple: true });
    fireEvent.click(screen.getByRole('button', { name: 'Left' }));
    fireEvent.click(screen.getByRole('button', { name: 'Right' }));

    expect(
      screen.getByRole('button', { name: 'Left' }).getAttribute('aria-pressed'),
    ).toBe('true');
    expect(
      screen
        .getByRole('button', { name: 'Right' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('starts with defaultValue pressed', () => {
    renderGroup({ defaultValue: ['right'] });

    expect(
      screen
        .getByRole('button', { name: 'Right' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
  });
});
