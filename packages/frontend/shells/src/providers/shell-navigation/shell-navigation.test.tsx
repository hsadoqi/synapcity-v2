import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { ShellLink, ShellNavigationProvider } from './shell-navigation';

describe('ShellLink', () => {
  it('falls back to a plain anchor that keeps its href, class and label', () => {
    render(
      <ShellLink href="/u/settings" className="probe" aria-label="Settings">
        Settings
      </ShellLink>,
    );

    const link = screen.getByRole('link', { name: 'Settings' });
    expect(link.getAttribute('href')).toBe('/u/settings');
    expect(link.className).toBe('probe');
  });

  it('uses the host link when a provider supplies one', () => {
    const HostLink = ({
      href,
      children,
    }: {
      href: string;
      children?: ReactNode;
    }) => (
      <a href={href} data-host-link="">
        {children}
      </a>
    );

    render(
      <ShellNavigationProvider value={{ Link: HostLink }}>
        <ShellLink href="/u/home">Home</ShellLink>
      </ShellNavigationProvider>,
    );

    const link = screen.getByRole('link', { name: 'Home' });
    expect(link.hasAttribute('data-host-link')).toBe(true);
    expect(link.getAttribute('href')).toBe('/u/home');
  });
});
