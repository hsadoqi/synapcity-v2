import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@synapcity/frontend-ui/core/select';

const renderSelect = ({
  rootProps = {},
  triggerProps = {},
}: {
  rootProps?: Record<string, unknown>;
  triggerProps?: Record<string, unknown>;
} = {}) =>
  render(
    <Select {...rootProps}>
      <SelectTrigger aria-label="Theme" {...triggerProps}>
        <SelectValue placeholder="Choose a theme" />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        <SelectGroup>
          <SelectLabel>Appearance</SelectLabel>
          <SelectItem value="light">Light</SelectItem>
          <SelectItem value="dark">Dark</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectItem value="system">System</SelectItem>
      </SelectContent>
    </Select>,
  );

/** Base UI commits an item on pointer-up, which a bare click does not send. */
const pick = async (name: string) => {
  const option = await screen.findByRole('option', { name });
  fireEvent.pointerDown(option);
  fireEvent.pointerUp(option);
  fireEvent.mouseUp(option);
  fireEvent.click(option);
};

const trigger = () => screen.getByRole('combobox', { name: 'Theme' });

describe('Select', () => {
  it('shows the placeholder until a value is chosen', () => {
    renderSelect();

    expect(trigger().textContent).toContain('Choose a theme');
    expect(trigger().getAttribute('data-slot')).toBe('select-trigger');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('shows the default value', () => {
    renderSelect({ rootProps: { defaultValue: 'dark' } });

    expect(trigger().textContent).toContain('dark');
  });

  it('opens a listbox of options from the trigger', async () => {
    renderSelect();

    fireEvent.click(trigger());

    expect(await screen.findByRole('listbox')).toBeTruthy();
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Light',
      'Dark',
      'System',
    ]);
  });

  it('selects an option, reports it and closes', async () => {
    const onValueChange = vi.fn();
    renderSelect({ rootProps: { onValueChange } });

    fireEvent.click(trigger());
    await pick('Dark');

    expect(onValueChange).toHaveBeenCalledWith('dark', expect.any(Object));
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    // Without an items map the trigger shows the raw value, not the label.
    expect(trigger().textContent).toContain('dark');
  });

  it('marks the chosen option as selected', async () => {
    renderSelect({ rootProps: { defaultValue: 'system' } });

    fireEvent.click(trigger());

    expect(
      (await screen.findByRole('option', { name: 'System' })).getAttribute(
        'aria-selected',
      ),
    ).toBe('true');
    expect(
      screen
        .getByRole('option', { name: 'Light' })
        .getAttribute('aria-selected'),
    ).toBe('false');
  });

  it('is controlled when given value', async () => {
    const { rerender } = render(
      <Select value="light">
        <SelectTrigger aria-label="Theme">
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectItem value="light">Light</SelectItem>
          <SelectItem value="dark">Dark</SelectItem>
        </SelectContent>
      </Select>,
    );
    fireEvent.click(trigger());
    await pick('Dark');
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    expect(trigger().textContent).toContain('light');

    rerender(
      <Select value="dark">
        <SelectTrigger aria-label="Theme">
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectItem value="light">Light</SelectItem>
          <SelectItem value="dark">Dark</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(trigger().textContent).toContain('dark');
  });

  it('does not open when disabled', () => {
    renderSelect({ rootProps: { disabled: true } });

    fireEvent.click(trigger());

    expect(screen.queryByRole('listbox')).toBeNull();
    expect(trigger().hasAttribute('data-disabled')).toBe(true);
  });

  it('defaults the trigger size and honours sm', () => {
    const { unmount } = renderSelect();
    expect(trigger().getAttribute('data-size')).toBe('default');
    unmount();

    renderSelect({ triggerProps: { size: 'sm' } });
    expect(trigger().getAttribute('data-size')).toBe('sm');
  });

  // Like Button and Input: compact for a mouse, 44px for a finger. The trigger
  // needs the size-qualified form, because a bare `pointer-coarse:h-11` is less
  // specific than `data-[size=default]:h-7` and would lose to it.
  it('grows the trigger and options to a 44px touch target on coarse pointers', async () => {
    renderSelect({ rootProps: { defaultOpen: true } });

    expect(trigger().className).toContain(
      'pointer-coarse:data-[size=default]:h-11',
    );
    expect(trigger().className).toContain('pointer-coarse:data-[size=sm]:h-11');
    expect(
      (await screen.findByRole('option', { name: 'Light' })).className,
    ).toContain('pointer-coarse:min-h-11');
  });

  it('exposes the invalid state on the trigger', () => {
    renderSelect({ triggerProps: { 'aria-invalid': true } });

    expect(trigger().getAttribute('aria-invalid')).toBe('true');
  });

  it('marks slots on the popup, group, label and separator', async () => {
    renderSelect({ rootProps: { defaultOpen: true } });
    await screen.findByRole('listbox');

    for (const slot of [
      'select-content',
      'select-group',
      'select-label',
      'select-separator',
    ]) {
      expect(document.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    }
    expect(
      screen.getByRole('option', { name: 'Light' }).getAttribute('data-slot'),
    ).toBe('select-item');
  });
});
