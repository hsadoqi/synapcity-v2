import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Switch } from '@synapcity/frontend-ui/core/switch';

describe('Switch', () => {
  it('is a switch that starts off', () => {
    render(<Switch aria-label="Notifications" />);
    const toggle = screen.getByRole('switch', { name: 'Notifications' });

    expect(toggle.getAttribute('aria-checked')).toBe('false');
    expect(toggle.getAttribute('data-slot')).toBe('switch');
  });

  it('can start on with defaultChecked', () => {
    render(<Switch aria-label="Notifications" defaultChecked />);

    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe(
      'true',
    );
  });

  it('toggles on click and reports the new state', () => {
    const onCheckedChange = vi.fn();
    render(
      <Switch aria-label="Notifications" onCheckedChange={onCheckedChange} />,
    );
    const toggle = screen.getByRole('switch');

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    expect(onCheckedChange).toHaveBeenLastCalledWith(true, expect.any(Object));

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    expect(onCheckedChange).toHaveBeenLastCalledWith(false, expect.any(Object));
  });

  it('is controlled when given checked', () => {
    const { rerender } = render(
      <Switch aria-label="Notifications" checked={false} />,
    );
    const toggle = screen.getByRole('switch');

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-checked')).toBe('false');

    rerender(<Switch aria-label="Notifications" checked />);
    expect(toggle.getAttribute('aria-checked')).toBe('true');
  });

  it('does not toggle when disabled', () => {
    const onCheckedChange = vi.fn();
    render(
      <Switch
        aria-label="Notifications"
        disabled
        onCheckedChange={onCheckedChange}
      />,
    );
    const toggle = screen.getByRole('switch');

    fireEvent.click(toggle);

    expect(toggle.getAttribute('aria-checked')).toBe('false');
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(toggle.hasAttribute('data-disabled')).toBe(true);
  });

  it('toggles from the keyboard', () => {
    render(<Switch aria-label="Notifications" />);
    const toggle = screen.getByRole('switch');

    toggle.focus();
    fireEvent.keyDown(toggle, { key: ' ' });
    fireEvent.keyUp(toggle, { key: ' ' });

    expect(toggle.getAttribute('aria-checked')).toBe('true');
  });

  it('defaults to the default size and honours sm', () => {
    const { rerender } = render(<Switch aria-label="Notifications" />);
    expect(screen.getByRole('switch').getAttribute('data-size')).toBe(
      'default',
    );

    rerender(<Switch aria-label="Notifications" size="sm" />);
    expect(screen.getByRole('switch').getAttribute('data-size')).toBe('sm');
  });

  it('renders a thumb inside the track', () => {
    render(<Switch aria-label="Notifications" />);

    expect(
      screen.getByRole('switch').querySelector('[data-slot="switch-thumb"]'),
    ).not.toBeNull();
  });

  it('merges a caller className', () => {
    render(<Switch aria-label="Notifications" className="ml-2" />);

    expect(screen.getByRole('switch').className).toContain('ml-2');
  });
});
