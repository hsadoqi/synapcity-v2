import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RootSidebar } from '.';
import { SidebarProvider } from '@synapcity/frontend-ui/core/sidebar';
import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';
import { ModeProvider } from '@synapcity/frontend-preferences';
import { sampleSidebarGroups } from '../../../testing/sidebar-sample';

const renderSidebar = (
  props: Partial<React.ComponentProps<typeof RootSidebar>> = {},
) =>
  render(
    <ModeProvider>
      <TooltipProvider>
        <SidebarProvider>
          <RootSidebar
            settingsHref="/u/settings"
            groups={sampleSidebarGroups}
            {...props}
          />
        </SidebarProvider>
      </TooltipProvider>
    </ModeProvider>,
  );

const menuLinks = () =>
  screen
    .getAllByRole('link')
    .filter((link) => link.getAttribute('data-slot') === 'sidebar-menu-button');

describe('RootSidebar', () => {
  it('shows the header it is given', () => {
    renderSidebar({ header: <p>Context and search</p> });
    const header = document.querySelector('[data-slot="sidebar-header"]')!;

    expect(header.textContent).toBe('Context and search');
  });

  it('renders no header when given none', () => {
    renderSidebar();

    expect(document.querySelector('[data-slot="sidebar-header"]')).toBeNull();
  });

  it('groups navigation under one label per section', () => {
    renderSidebar();

    for (const group of sampleSidebarGroups) {
      expect(screen.getByText(group.title)).toBeTruthy();
    }
  });

  it('links every navigation item to its href', () => {
    renderSidebar();
    const items = sampleSidebarGroups.flatMap((group) => group.items);

    // The settings link in the mobile footer is a menu button too.
    expect(menuLinks()).toHaveLength(items.length + 1);
    for (const item of items) {
      const content = document.querySelector(
        '[data-slot="sidebar-content"]',
      ) as HTMLElement;
      expect(
        within(content)
          .getByRole('link', { name: item.title })
          .getAttribute('href'),
      ).toBe(item.href);
    }
  });

  it('flags the active page', () => {
    renderSidebar();
    const content = document.querySelector(
      '[data-slot="sidebar-content"]',
    ) as HTMLElement;

    expect(
      within(content)
        .getByRole('link', { name: 'Home' })
        .hasAttribute('data-active'),
    ).toBe(true);
    expect(
      within(content)
        .getByRole('link', { name: 'Training log' })
        .hasAttribute('data-active'),
    ).toBe(false);
  });

  it('shows no template navigation when given no groups', () => {
    renderSidebar({ groups: [] });

    expect(screen.queryByText('Getting Started')).toBeNull();
    expect(menuLinks()).toHaveLength(1);
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
