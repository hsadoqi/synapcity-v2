import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthenticatedShell, PublicShell, RootShell } from '.';
import { ModeProvider } from '@synapcity/frontend-preferences';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

const account = { homeHref: '/u/home', settingsHref: '/u/settings' };

const renderShell = (props: Partial<Parameters<typeof RootShell>[0]> = {}) =>
  render(
    <ModeProvider>
      <RootShell {...props}>
        <p>Hello</p>
      </RootShell>
    </ModeProvider>,
  );

describe('RootShell', () => {
  it('renders header, main and footer landmarks around the page', () => {
    renderShell();

    expect(screen.getByRole('banner')).toBeTruthy();
    expect(screen.getByRole('main').textContent).toBe('Hello');
    expect(screen.getByRole('contentinfo')).toBeTruthy();
  });

  // A sticky bar without a z-index is painted in page order with the other
  // positioned boxes, so the page content (RootContent is \`relative\`) was
  // drawn over the header as it scrolled. jsdom cannot paint; this guards the
  // stacking order the fix depends on.
  it.each([
    ['public', {}],
    ['authenticated', { account }],
  ])('keeps the %s sticky header above the page content', (_name, props) => {
    renderShell(props);
    const bar = screen.getByRole('banner').closest('.sticky');

    expect(bar).not.toBeNull();
    expect(bar!.className).toMatch(/(^|\s)z-\d+(\s|$)/);
  });

  it('puts the skip link first in the tab order', () => {
    renderShell();
    const skip = screen.getByRole('link', { name: 'Skip to main content' });

    expect(skip.getAttribute('href')).toBe('#main-content');
    expect(document.body.querySelector('a, button')?.textContent).toBe(
      'Skip to main content',
    );
  });

  it('is the public shell without an account', () => {
    renderShell();

    expect(document.querySelector('[data-slot="public-shell"]')).not.toBeNull();
    expect(
      document.querySelector('[data-slot="authenticated-shell"]'),
    ).toBeNull();
    expect(screen.queryByRole('button', { name: 'Open sidebar' })).toBeNull();
  });

  it('is the public shell when the account is null', () => {
    renderShell({ account: null });

    expect(document.querySelector('[data-slot="public-shell"]')).not.toBeNull();
  });

  it('is the authenticated shell with an account, with a sidebar trigger', () => {
    renderShell({ account });

    expect(
      document.querySelector('[data-slot="authenticated-shell"]'),
    ).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Open sidebar' })).toBeTruthy();
  });

  it('renders header actions', () => {
    renderShell({ headerActions: <button type="button">Action</button> });

    expect(screen.getByRole('button', { name: 'Action' })).toBeTruthy();
  });

  it('exposes both shell variants', () => {
    expect(typeof PublicShell).toBe('function');
    expect(typeof AuthenticatedShell).toBe('function');
  });

  it('offers the panel only in the authenticated shell and passes caller-owned contents', () => {
    const view = renderShell({ account, globalPanel: <p>Caller utility</p> });
    expect(
      screen
        .getByRole('button', { name: 'Toggle global panel' })
        .getAttribute('aria-expanded'),
    ).toBe('false');
    expect(
      document.querySelector('[data-root-global-panel]')?.textContent,
    ).toContain('Caller utility');
    view.unmount();
    renderShell();
    expect(
      screen.queryByRole('button', { name: 'Toggle global panel' }),
    ).toBeNull();
    expect(document.querySelector('[data-root-global-panel]')).toBeNull();
  });
});
