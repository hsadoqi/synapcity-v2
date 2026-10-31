'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { ShellNavigationProvider } from '../../providers/shell-navigation';

const value = { Link };

/** The Next.js binding: mount once above the shell so its links navigate client-side. */
export function NextShellNavigation({ children }: { children: ReactNode }) {
  return (
    <ShellNavigationProvider value={value}>{children}</ShellNavigationProvider>
  );
}
