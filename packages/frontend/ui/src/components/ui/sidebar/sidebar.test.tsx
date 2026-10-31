import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mockViewport } from '@synapcity/dev-vitest-config/viewport';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from '@synapcity/frontend-ui/core/sidebar';
import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';

const State = () => {
  const { state, open, openMobile, isMobile } = useSidebar();
  return (
    <output data-testid="state">
      {JSON.stringify({ state, open, openMobile, isMobile })}
    </output>
  );
};

const trigger = () => screen.getByRole('button', { name: /navigation$/ });

const readState = () => JSON.parse(screen.getByTestId('state').textContent!);

const renderShell = (providerProps = {}, sidebarProps = {}) =>
  render(
    <TooltipProvider>
      <SidebarProvider {...providerProps}>
        <Sidebar {...sidebarProps}>
          <SidebarHeader data-testid="header">Header</SidebarHeader>
          <SidebarSeparator />
          <SidebarContent data-testid="content">
            <SidebarGroup data-testid="group">
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive>Home</SidebarMenuButton>
                    <SidebarMenuBadge>3</SidebarMenuBadge>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>Child</SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter data-testid="footer">Footer</SidebarFooter>
        </Sidebar>
        <SidebarInset data-testid="inset">
          <SidebarTrigger />
          <State />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>,
  );

describe('Sidebar', () => {
  beforeEach(() => mockViewport({ width: 1280 }));
  afterEach(() => {
    document.cookie = 'sidebar_state=; max-age=0; path=/';
  });

  it('throws when useSidebar is used outside a provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<State />)).toThrow(
      'useSidebar must be used within a SidebarProvider.',
    );
    spy.mockRestore();
  });

  it('starts expanded and honours defaultOpen', () => {
    const { unmount } = renderShell();
    expect(readState()).toMatchObject({ state: 'expanded', open: true });
    unmount();

    renderShell({ defaultOpen: false });
    expect(readState()).toMatchObject({ state: 'collapsed', open: false });
  });

  it('wraps everything in a sidebar wrapper', () => {
    renderShell();
    const wrapper = document.querySelector('[data-slot="sidebar-wrapper"]');

    expect(wrapper).not.toBeNull();
    expect(
      (wrapper as HTMLElement).style.getPropertyValue('--sidebar-width'),
    ).toBe('20svw');
  });

  it('sizes to the window by default', () => {
    renderShell();
    const wrapper = document.querySelector('[data-slot="sidebar-wrapper"]')!;
    const container = document.querySelector(
      '[data-slot="sidebar-container"]',
    )!;

    expect(wrapper.className).toContain('min-h-svh');
    expect(container.className).toContain('fixed');
    expect(container.className).toContain('h-svh');
  });

  it('sizes to its own box when contained', () => {
    renderShell({ contained: true });
    const wrapper = document.querySelector(
      '[data-slot="sidebar-wrapper"]',
    ) as HTMLElement;
    const container = document.querySelector(
      '[data-slot="sidebar-container"]',
    )!;

    expect(wrapper.className).toContain('relative');
    expect(wrapper.className).toContain('@container');
    expect(wrapper.className).toContain('h-full');
    expect(wrapper.className).not.toContain('min-h-svh');
    expect(wrapper.style.getPropertyValue('--sidebar-width')).toBe(
      'clamp(13rem, 22cqw, 20rem)',
    );
    expect(container.className).toContain('absolute');
    expect(container.className).not.toContain('fixed');
  });

  it('renders the desktop sidebar with state, side and variant', () => {
    renderShell({}, { side: 'right', variant: 'floating' });
    const sidebar = document.querySelector('[data-slot="sidebar"]')!;

    expect(sidebar.getAttribute('data-state')).toBe('expanded');
    expect(sidebar.getAttribute('data-side')).toBe('right');
    expect(sidebar.getAttribute('data-variant')).toBe('floating');
  });

  it('reports the collapsible mode only while collapsed', () => {
    renderShell({ defaultOpen: false }, { collapsible: 'icon' });

    expect(
      document
        .querySelector('[data-slot="sidebar"]')!
        .getAttribute('data-collapsible'),
    ).toBe('icon');
  });

  it('renders a plain static panel when not collapsible', () => {
    renderShell({}, { collapsible: 'none' });
    const sidebar = document.querySelector('[data-slot="sidebar"]')!;

    expect(sidebar.hasAttribute('data-state')).toBe(false);
    expect(screen.getByTestId('header')).toBeTruthy();
  });

  it('toggles from the trigger and persists the choice in a cookie', () => {
    renderShell();
    fireEvent.click(trigger());

    expect(readState().open).toBe(false);
    expect(document.cookie).toContain('sidebar_state=false');
    fireEvent.click(trigger());
    expect(readState().open).toBe(true);
    expect(document.cookie).toContain('sidebar_state=true');
  });

  it('names the trigger for the action it will take and mirrors the state', () => {
    renderShell();

    expect(trigger().getAttribute('aria-label')).toBe('Close navigation');
    expect(trigger().hasAttribute('aria-pressed')).toBe(false);
    fireEvent.click(trigger());
    expect(trigger().getAttribute('aria-label')).toBe('Open navigation');
  });

  it('leaves keyboard shortcuts to the shell that owns them', () => {
    renderShell();

    expect(trigger().hasAttribute('aria-keyshortcuts')).toBe(false);
    fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
    fireEvent.keyDown(window, { key: 'b', metaKey: true });
    expect(readState().open).toBe(true);
  });

  it('stays controlled when given open and onOpenChange', () => {
    const onOpenChange = vi.fn();
    renderShell({ open: true, onOpenChange });
    fireEvent.click(trigger());

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(readState().open).toBe(true);
  });

  it('marks the structural parts with their slots', () => {
    renderShell();

    for (const slot of [
      'sidebar-header',
      'sidebar-footer',
      'sidebar-content',
      'sidebar-group',
      'sidebar-group-label',
      'sidebar-group-content',
      'sidebar-menu',
      'sidebar-menu-item',
      'sidebar-menu-badge',
      'sidebar-menu-sub',
      'sidebar-menu-sub-item',
      'sidebar-separator',
      'sidebar-inset',
      'sidebar-trigger',
    ]) {
      expect(
        document.querySelector(`[data-slot="${slot}"]`),
        slot,
      ).not.toBeNull();
    }
  });

  it('flags the active menu button', () => {
    renderShell();
    const button = screen.getByRole('button', { name: 'Home' });

    expect(button.getAttribute('data-slot')).toBe('sidebar-menu-button');
    expect(button.hasAttribute('data-active')).toBe(true);
  });

  it('renders a skeleton with an optional icon', () => {
    render(
      <>
        <SidebarMenuSkeleton data-testid="plain" />
        <SidebarMenuSkeleton data-testid="icon" showIcon />
      </>,
    );

    expect(
      screen
        .getByTestId('plain')
        .querySelector('[data-sidebar="menu-skeleton-icon"]'),
    ).toBeNull();
    expect(
      screen
        .getByTestId('icon')
        .querySelector('[data-sidebar="menu-skeleton-icon"]'),
    ).not.toBeNull();
  });

  describe('on a small screen', () => {
    beforeEach(() => mockViewport({ width: 500 }));

    it('renders no desktop sidebar and opens a sheet from the trigger', async () => {
      renderShell();
      await act(async () => {});
      expect(readState().isMobile).toBe(true);
      expect(screen.queryByRole('dialog')).toBeNull();

      fireEvent.click(trigger());
      const dialog = await screen.findByRole('dialog', { name: 'Sidebar' });

      expect(dialog.getAttribute('data-mobile')).toBe('true');
      expect(readState().openMobile).toBe(true);
    });
  });
});
