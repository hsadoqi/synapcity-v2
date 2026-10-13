import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { UserMenu } from './user-menu';
import { DropdownMenuItem } from './ui/dropdown-menu';

describe('UserMenu', () => {
  it('names the trigger for assistive tech', () => {
    render(
      <UserMenu name="Hanaa Sadoqi" email="h@example.com" imageUrl={null} />,
    );

    expect(screen.getByRole('button', { name: 'Account menu' })).toBeTruthy();
  });

  it('keeps its toggle state in sync when Escape dismisses the menu', async () => {
    render(
      <UserMenu name="Hanaa" email="h@example.com" imageUrl={null}>
        <DropdownMenuItem>Sign out</DropdownMenuItem>
      </UserMenu>,
    );
    const button = screen.getByRole('button', { name: 'Account menu' });

    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(button.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(button);
    const item = await screen.findByRole('menuitem', { name: 'Sign out' });
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.getAttribute('aria-expanded')).toBe('true');
    fireEvent.keyDown(item, { key: 'Escape' });
    await waitFor(() =>
      expect(button.getAttribute('aria-pressed')).toBe('false'),
    );
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('shows an account tooltip on focus', async () => {
    render(<UserMenu name="Hanaa" email="h@example.com" imageUrl={null} />);
    fireEvent.focus(screen.getByRole('button', { name: 'Account menu' }));
    const tooltip = await screen.findByText('Account menu');
    expect(tooltip.getAttribute('data-slot')).toBe('tooltip-content');
    expect(tooltip.hasAttribute('data-open')).toBe(true);
  });
});
