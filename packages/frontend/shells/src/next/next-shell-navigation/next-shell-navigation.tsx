'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';

import { ShellNavigationProvider } from '../../providers/shell-navigation';
import { LinkButton } from '@synapcity/frontend-ui/next/link-button';

const value = { Link, LinkButton };

/** The Next.js binding: mount once above the shell so its links navigate client-side. */
export function NextShellNavigation({ children }: { children: ReactNode }) {
  return (
    <ShellNavigationProvider value={value}>{children}</ShellNavigationProvider>
  );
}
