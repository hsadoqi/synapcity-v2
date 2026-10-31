import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children?: React.ReactNode;
  }) => (
    <a href={href} data-next-link="">
      {children}
    </a>
  ),
}));

import { ShellLink } from '../../providers/shell-navigation';
import { NextShellNavigation } from './next-shell-navigation';

describe('NextShellNavigation', () => {
  it('makes every shell link a Next.js link', () => {
    render(
      <NextShellNavigation>
        <ShellLink href="/u/home">Home</ShellLink>
      </NextShellNavigation>,
    );

    const link = screen.getByRole('link', { name: 'Home' });
    expect(link.hasAttribute('data-next-link')).toBe(true);
    expect(link.getAttribute('href')).toBe('/u/home');
  });
});
