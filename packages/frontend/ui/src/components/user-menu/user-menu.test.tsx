import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { UserMenu } from '@synapcity/frontend-ui/components/user-menu';
import { DropdownMenuItem } from '@synapcity/frontend-ui/core/dropdown-menu';

describe('UserMenu', () => {
  it('names the trigger for assistive tech', () => {
    render(
      <UserMenu
        homeHref="/user-1/home"
        settingsHref="/user-1/settings"
        name="Hanaa Sadoqi"
        email="h@example.com"
        imageUrl={null}
      />,
    );

    expect(screen.getByRole('button', { name: 'Account menu' })).toBeTruthy();
  });

  it('keeps aria-expanded in sync when Escape dismisses the menu', async () => {
    render(
      <UserMenu
        homeHref="/user-1/home"
        settingsHref="/user-1/settings"
        name="Hanaa"
        email="h@example.com"
        imageUrl={null}
      >
        <DropdownMenuItem>Sign out</DropdownMenuItem>
      </UserMenu>,
    );
    const button = screen.getByRole('button', { name: 'Account menu' });

    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(button.hasAttribute('aria-pressed')).toBe(false);
    expect(button.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(button);
    const item = await screen.findByRole('menuitem', { name: 'Sign out' });
    expect(button.getAttribute('aria-expanded')).toBe('true');
    fireEvent.keyDown(item, { key: 'Escape' });
    await waitFor(() =>
      expect(button.getAttribute('aria-expanded')).toBe('false'),
    );
  });

  it('shows an account tooltip on focus', async () => {
    render(
      <UserMenu
        homeHref="/user-1/home"
        settingsHref="/user-1/settings"
        name="Hanaa"
        email="h@example.com"
        imageUrl={null}
      />,
    );
    fireEvent.focus(screen.getByRole('button', { name: 'Account menu' }));
    const tooltip = await screen.findByText('Account menu');
    expect(tooltip.getAttribute('data-slot')).toBe('tooltip-content');
    expect(tooltip.hasAttribute('data-open')).toBe(true);
  });

  it('calls onSignOut when Sign out is chosen', async () => {
    const onSignOut = vi.fn();
    render(
      <UserMenu
        homeHref="/user-1/home"
        settingsHref="/user-1/settings"
        name="Hanaa"
        email="h@example.com"
        imageUrl={null}
        onSignOut={onSignOut}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Account menu' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Sign out' }));
    await waitFor(() => expect(onSignOut).toHaveBeenCalledTimes(1));
  });

  it('offers no Sign out item without onSignOut', async () => {
    render(
      <UserMenu
        homeHref="/user-1/home"
        settingsHref="/user-1/settings"
        name="Hanaa"
        email="h@example.com"
        imageUrl={null}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Account menu' }));
    await screen.findByRole('menu');
    expect(screen.queryByRole('menuitem', { name: 'Sign out' })).toBeNull();
  });

  it('offers Home and Settings as links that are themselves the menu items', async () => {
    render(
      <UserMenu
        homeHref="/user-1/home"
        settingsHref="/user-1/settings"
        name="Hanaa"
        email="h@example.com"
        imageUrl={null}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Account menu' }));

    const home = await screen.findByRole('menuitem', { name: 'Home' });
    const settings = await screen.findByRole('menuitem', { name: 'Settings' });

    expect(home.tagName).toBe('A');
    expect(home.getAttribute('href')).toBe('/user-1/home');
    expect(settings.tagName).toBe('A');
    expect(settings.getAttribute('href')).toBe('/user-1/settings');
    // Nothing interactive is nested inside a menu item.
    expect(home.querySelector('a, button')).toBeNull();
    expect(settings.querySelector('a, button')).toBeNull();
  });
});
