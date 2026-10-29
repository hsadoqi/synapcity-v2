import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

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
          <RootSidebar groups={sampleSidebarGroups} {...props} />
        </SidebarProvider>
      </TooltipProvider>
    </ModeProvider>,
  );

const menuLinks = () =>
  screen
    .queryAllByRole('link')
    .filter((link) => link.getAttribute('data-slot') === 'sidebar-menu-button');

describe('RootSidebar', () => {
  it('shows a disabled item as a focusable, unusable button with its note', () => {
    const onSelect = vi.fn();
    renderSidebar({
      groups: [
        { items: [{ title: 'Inbox', disabled: true, note: 'Soon', onSelect }] },
      ],
    });
    const inbox = screen.getByRole('button', { name: /Inbox/ });

    expect(inbox.getAttribute('aria-disabled')).toBe('true');
    expect(inbox.textContent).toContain('Soon');
    expect(menuLinks()).toHaveLength(0);
    fireEvent.click(inbox);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('shows the header it is given', () => {
    renderSidebar({ header: <p>Context and search</p> });
    const header = document.querySelector('[data-slot="sidebar-header"]')!;

    expect(header.textContent).toBe('Context and search');
  });

  it('renders no header when given none', () => {
    renderSidebar();

    expect(document.querySelector('[data-slot="sidebar-header"]')).toBeNull();
  });

  it('gives a group without a title no label', () => {
    renderSidebar({
      groups: [{ items: [{ title: 'Home', href: '/u/home' }] }],
    });

    expect(
      document.querySelector('[data-slot="sidebar-group-label"]'),
    ).toBeNull();
    expect(screen.getByRole('link', { name: 'Home' })).toBeTruthy();
  });

  it('groups navigation under one label per section', () => {
    renderSidebar();

    for (const group of sampleSidebarGroups) {
      expect(screen.getByText(group.title!)).toBeTruthy();
    }
  });

  it('links every navigation item to its href', () => {
    renderSidebar();
    const items = sampleSidebarGroups.flatMap((group) => group.items ?? []);

    expect(menuLinks()).toHaveLength(items.length);
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
    expect(menuLinks()).toHaveLength(0);
  });

  it('renders the footer it is given above the theme toggle', () => {
    renderSidebar({ footer: <p>Account row</p> });
    const footer = document.querySelector('[data-slot="sidebar-footer"]')!;

    expect(footer.textContent).toContain('Account row');
  });

  it('runs an item without an href as a button', () => {
    const onSelect = vi.fn();
    renderSidebar({
      groups: [{ items: [{ title: 'Command palette', onSelect }] }],
    });

    fireEvent.click(screen.getByRole('button', { name: 'Command palette' }));
    expect(onSelect).toHaveBeenCalledOnce();
    expect(screen.queryByRole('link', { name: 'Command palette' })).toBeNull();
  });

  it('links a group title to its page and offers its action', () => {
    const onSelect = vi.fn();
    renderSidebar({
      groups: [
        {
          title: 'Spaces',
          href: '/u/home/spaces',
          action: { label: 'New space', onSelect },
          items: [{ title: 'Writing', href: '/u/home/spaces/s1' }],
        },
      ],
    });

    expect(
      screen.getByRole('link', { name: 'Spaces' }).getAttribute('href'),
    ).toBe('/u/home/spaces');
    fireEvent.click(screen.getByRole('button', { name: 'New space' }));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it('says so when a group has no items, and renders custom content', () => {
    renderSidebar({
      groups: [
        { title: 'Documents', items: [], empty: 'No documents yet' },
        { content: <input aria-label="Search" /> },
      ],
    });

    expect(screen.getByText('No documents yet')).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Search' })).toBeTruthy();
  });

  it('can hide a group while folded to icons', () => {
    renderSidebar({
      groups: [
        { items: [{ title: 'Home', href: '/u/home' }] },
        { title: 'Spaces', hideWhenCollapsed: true, items: [] },
      ],
    });
    const [core, spaces] = document.querySelectorAll(
      '[data-slot="sidebar-group"]',
    );

    expect(core!.className).not.toContain('collapsible=icon]:hidden');
    expect(spaces!.className).toContain('group-data-[collapsible=icon]:hidden');
  });

  it('collapses to icons rather than off the screen', () => {
    renderSidebar();

    expect(
      document
        .querySelector('[data-slot="sidebar"]')!
        .getAttribute('data-collapsible'),
    ).toBe('');
    expect(screen.getByRole('link', { name: 'Home' })).toBeTruthy();
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
