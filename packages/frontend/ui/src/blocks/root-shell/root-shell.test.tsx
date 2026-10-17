import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  AuthenticatedShell,
  PublicShell,
  RootShell,
} from '@synapcity/frontend-ui/blocks/root-shell';
import { ModeProvider } from '@synapcity/frontend-ui/providers/mode-provider';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

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
    expect(screen.queryByRole('button', { name: /navigation$/ })).toBeNull();
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
    expect(screen.getByRole('button', { name: /navigation$/ })).toBeTruthy();
  });

  it('renders header actions', () => {
    renderShell({ headerActions: <button type="button">Action</button> });

    expect(screen.getByRole('button', { name: 'Action' })).toBeTruthy();
  });

  it('exposes both shell variants', () => {
    expect(typeof PublicShell).toBe('function');
    expect(typeof AuthenticatedShell).toBe('function');
  });
});
