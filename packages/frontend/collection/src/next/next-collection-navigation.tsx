'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, type ReactNode } from 'react';

import { CollectionNavigationProvider } from '../providers';
import { LinkButton } from '@synapcity/frontend-ui/next/link-button';

/** The Next.js binding: mount once above the pages that show collections. */
export function NextCollectionNavigation({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const value = useMemo(
    () => ({
      Link,
      LinkButton,
      push: (href: string) => router.push(href),
    }),
    [router],
  );
  return (
    <CollectionNavigationProvider value={value}>
      {children}
    </CollectionNavigationProvider>
  );
}
