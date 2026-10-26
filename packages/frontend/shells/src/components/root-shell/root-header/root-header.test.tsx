import { render, screen, within } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { ModeProvider } from '@synapcity/frontend-preferences';
import { RootHeader, RootHeaderContent } from '.';
import { SidebarProvider } from '@synapcity/frontend-ui/core/sidebar';
import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';
import { GlobalPanelShell } from '../global-panel';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

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
  it('leaves the logo to the sidebar once signed in', () => {
    expect(html('user-1')).not.toContain('Synapcity home');
  });

  it('links the logo to the landing page when signed out', () => {
    const markup = html(null);

    expect(markup).toContain('href="/"');
    expect(markup).not.toContain('/settings');
  });

  it('offers no settings link signed in either; it lives in the sidebar', () => {
    expect(html('user-1')).not.toContain('/settings');
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

  it('shows no logo link when signed in, since the sidebar carries the brand', () => {
    renderHeader(account);

    expect(screen.queryByRole('link', { name: 'Synapcity home' })).toBeNull();
  });

  it('shows the breadcrumb trail when signed in, ending on the current page', () => {
    render(
      <ModeProvider>
        <TooltipProvider>
          <SidebarProvider>
            <RootHeader
              account={account}
              breadcrumbs={[
                { label: 'Spaces', href: '/u/home/spaces' },
                { label: 'Fitness' },
              ]}
            />
          </SidebarProvider>
        </TooltipProvider>
      </ModeProvider>,
    );
    const trail = screen.getByRole('navigation', { name: 'Breadcrumb' });

    expect(
      within(trail).getByRole('link', { name: 'Spaces' }).getAttribute('href'),
    ).toBe('/u/home/spaces');
    expect(
      within(trail).getByText('Fitness').getAttribute('aria-current'),
    ).toBe('page');
  });

  it('shows no breadcrumb when signed out', () => {
    renderHeader(null);

    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).toBeNull();
  });

  it('sends the logo to the landing page when signed out', () => {
    renderHeader(null);

    expect(
      screen.getByRole('link', { name: 'Synapcity home' }).getAttribute('href'),
    ).toBe('/');
  });

  it('shows the sidebar trigger only when signed in', () => {
    const { unmount } = renderHeader(account);
    expect(screen.getByRole('button', { name: 'Open sidebar' })).toBeTruthy();
    unmount();

    renderHeader(null);
    expect(screen.queryByRole('button', { name: 'Open sidebar' })).toBeNull();
  });

  it('groups utility actions in a labelled navigation', () => {
    renderHeader(account, <button type="button">Extra</button>);
    const nav = screen.getByRole('navigation', {
      name: 'Account and appearance',
    });

    expect(within(nav).getByRole('button', { name: 'Theme' })).toBeTruthy();
    expect(within(nav).queryByRole('link', { name: 'Settings' })).toBeNull();
    expect(within(nav).getByRole('button', { name: 'Extra' })).toBeTruthy();
  });

  // Settings moved to the sidebar's core links; the header has none either way.
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
