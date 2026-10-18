import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { NotificationRow } from './notification-row';

describe('NotificationRow', () => {
  it('is a switch named by its label and described by its text', () => {
    render(
      <NotificationRow kind="email" checked={false} onChange={() => {}} />,
    );
    const toggle = screen.getByRole('switch', { name: 'Email notifications' });

    expect(toggle.getAttribute('aria-describedby')).toBe(
      'notifications-email-description',
    );
    expect(
      document.getElementById('notifications-email-description')?.textContent,
    ).toBe('Account and security alerts, and occasional product news.');
  });

  it('adds the blocked reason to the description and makes the switch read-only', () => {
    render(
      <NotificationRow
        kind="push"
        checked={false}
        onChange={() => {}}
        blockedReason="Blocked by the browser."
      />,
    );
    const toggle = screen.getByRole('switch', { name: 'Push notifications' });

    expect(toggle.getAttribute('aria-readonly')).toBe('true');
    expect(
      document.getElementById('notifications-push-description')?.textContent,
    ).toMatch(/Blocked by the browser\.$/);
  });

  it('reflects the checked value', () => {
    const { rerender } = render(
      <NotificationRow kind="push" checked={false} onChange={() => {}} />,
    );
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe(
      'false',
    );

    rerender(<NotificationRow kind="push" checked onChange={() => {}} />);
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe(
      'true',
    );
  });

  it('reports the new state when toggled', () => {
    const onChange = vi.fn();
    render(
      <NotificationRow kind="sound" checked={false} onChange={onChange} />,
    );

    fireEvent.click(screen.getByRole('switch'));

    expect(onChange).toHaveBeenCalledWith(true);
  });
});
