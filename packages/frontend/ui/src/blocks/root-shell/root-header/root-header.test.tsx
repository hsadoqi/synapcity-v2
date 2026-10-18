import { render, screen, within } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { ModeProvider } from '@synapcity/frontend-ui/providers/mode-provider';
import {
  RootHeader,
  RootHeaderContent,
} from '@synapcity/frontend-ui/blocks/root-shell/root-header';
import { SidebarProvider } from '@synapcity/frontend-ui/core/sidebar';
import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';
import { GlobalPanelShell } from '@synapcity/frontend-ui/blocks/root-shell/global-panel';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

// jsdom has no matchMedia, which the theme provider reads while rendering.
beforeAll(() => {
  vi.stubGlobal('matchMedia', (media: string) => ({
    matches: false,
    media,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
});

/**
 * Server render on purpose: the first HTML a visitor gets is what search
 * engines, link previews and no-JS clients see, and it is where a value synced
 * through state and an effect would still be wrong.
 */
function html(userId: string | null) {
  const account = userId
    ? { homeHref: `/${userId}/home`, settingsHref: `/${userId}/settings` }
    : null;
  return renderToString(
    <ModeProvider>
      <RootHeaderContent account={account} />
    </ModeProvider>,
  );
}

describe('RootHeaderContent', () => {
  it('links the logo to the visitor home in the server-rendered HTML', () => {
    expect(html('user-1')).toContain('href="/user-1/home"');
  });

  it('links the logo to the landing page when signed out', () => {
    const markup = html(null);

    expect(markup).toContain('href="/"');
    expect(markup).not.toContain('/settings');
  });

  it('offers settings only when signed in', () => {
    expect(html('user-1')).toContain('href="/user-1/settings"');
  });
});

describe('RootHeader', () => {
  const renderHeader = (
    account: { homeHref: string; settingsHref: string } | null,
    actions?: React.ReactNode,
  ) =>
    render(
      <ModeProvider>
        <TooltipProvider>
          <SidebarProvider>
            <RootHeader account={account} actions={actions} />
          </SidebarProvider>
        </TooltipProvider>
      </ModeProvider>,
    );
  const account = { homeHref: '/u/home', settingsHref: '/u/settings' };

  it('is the banner landmark', () => {
    renderHeader(null);

    expect(screen.getByRole('banner')).toBeTruthy();
  });

  it('names the logo link and sends it to the account home when signed in', () => {
    renderHeader(account);

    expect(
      screen.getByRole('link', { name: 'Synapcity home' }).getAttribute('href'),
    ).toBe('/u/home');
  });

  it('sends the logo to the landing page when signed out', () => {
    renderHeader(null);

    expect(
      screen.getByRole('link', { name: 'Synapcity home' }).getAttribute('href'),
    ).toBe('/');
  });

  it('shows the sidebar trigger only when signed in', () => {
    const { unmount } = renderHeader(account);
    expect(screen.getByRole('button', { name: /navigation$/ })).toBeTruthy();
    unmount();

    renderHeader(null);
    expect(screen.queryByRole('button', { name: /navigation$/ })).toBeNull();
  });

  it('groups utility actions in a labelled navigation', () => {
    renderHeader(account, <button type="button">Extra</button>);
    const nav = screen.getByRole('navigation', {
      name: 'Account and appearance',
    });

    expect(within(nav).getByRole('button', { name: 'Theme' })).toBeTruthy();
    expect(within(nav).getByRole('link', { name: 'Settings' })).toBeTruthy();
    expect(within(nav).getByRole('button', { name: 'Extra' })).toBeTruthy();
  });

  it('offers no settings link when signed out', () => {
    renderHeader(null);

    expect(screen.queryByRole('link', { name: 'Settings' })).toBeNull();
  });

  it('places the panel action in the account navigation when hosted by the panel shell', () => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    render(
      <ModeProvider>
        <TooltipProvider>
          <SidebarProvider>
            <GlobalPanelShell header={<RootHeader account={account} />}>
              <p>Page</p>
            </GlobalPanelShell>
          </SidebarProvider>
        </TooltipProvider>
      </ModeProvider>,
    );
    const nav = screen.getByRole('navigation', {
      name: 'Account and appearance',
    });
    expect(
      within(nav)
        .getByRole('button', { name: 'Toggle global panel' })
        .getAttribute('aria-expanded'),
    ).toBe('false');
  });
});
