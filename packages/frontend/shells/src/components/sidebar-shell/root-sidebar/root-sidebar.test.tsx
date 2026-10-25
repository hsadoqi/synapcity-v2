import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RootSidebar } from '.';
import { SidebarProvider } from '@synapcity/frontend-ui/core/sidebar';
import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';
import { data } from '@synapcity/frontend-ui/lib/sidebar-data';
import { ModeProvider } from '@synapcity/frontend-preferences';

const renderSidebar = (props = {}) =>
  render(
    <ModeProvider>
      <TooltipProvider>
        <SidebarProvider>
          <RootSidebar settingsHref="/u/settings" {...props} />
        </SidebarProvider>
      </TooltipProvider>
    </ModeProvider>,
  );

describe('RootSidebar', () => {
  it('shows the context switcher and search in its header', () => {
    renderSidebar();

    expect(screen.getByRole('button', { name: 'Switch version' })).toBeTruthy();
    expect(screen.getByLabelText('Search')).toBeTruthy();
  });

  it('groups navigation under one label per section', () => {
    renderSidebar();

    for (const section of data.navMain) {
      expect(screen.getByText(section.title)).toBeTruthy();
    }
  });

  it('links every navigation item', () => {
    renderSidebar();
    const total = data.navMain.reduce((n, s) => n + s.items.length, 0);
    const links = screen
      .getAllByRole('link')
      .filter(
        (link) => link.getAttribute('data-slot') === 'sidebar-menu-button',
      );

    // The settings link in the mobile footer is a menu button too.
    expect(links).toHaveLength(total + 1);
  });

  it('flags the active page', () => {
    renderSidebar();
    const active = data.navMain
      .flatMap((section) => section.items)
      .find((item) => 'isActive' in item && item.isActive)!;

    expect(
      screen
        .getByRole('link', { name: active.title })
        .hasAttribute('data-active'),
    ).toBe(true);
  });

  it('links settings to the supplied href in the footer', () => {
    renderSidebar({ settingsHref: '/hanaa/settings' });
    const footer = document.querySelector('[data-slot="sidebar-footer"]')!;

    expect(
      within(footer as HTMLElement)
        .getByRole('link', { name: 'Settings' })
        .getAttribute('href'),
    ).toBe('/hanaa/settings');
  });

  it('puts the theme toggle in the footer for small screens', () => {
    renderSidebar();
    const footer = document.querySelector('[data-slot="sidebar-footer"]')!;

    expect(
      within(footer as HTMLElement).getByRole('button', { name: 'Theme' }),
    ).toBeTruthy();
  });

  it('includes a rail to resize the sidebar', () => {
    renderSidebar();

    expect(screen.getByRole('button', { name: 'Toggle Sidebar' })).toBeTruthy();
  });
});
