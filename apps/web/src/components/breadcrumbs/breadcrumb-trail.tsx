'use client';
// TODO: Shouldnt this be in the ui package? why or why not?
import { createContext, useContext, useEffect, useState } from 'react';
import type { ComponentProps } from 'react';
import { RootShell } from '@synapcity/frontend-ui/blocks/root-shell';
import type { RootBreadcrumb } from '@synapcity/frontend-ui/blocks/root-shell/root-header';

type SetTrail = (items: RootBreadcrumb[]) => void;

const SetTrailContext = createContext<SetTrail>(() => {});

/**
 * The root shell, holding the breadcrumb trail for the page inside it. The
 * header sits in the root layout, above every page, so a page cannot pass it
 * props; it renders <SetBreadcrumbs> instead and this keeps what it said.
 */
export function BreadcrumbRootShell({
  children,
  ...shellProps
}: Omit<ComponentProps<typeof RootShell>, 'breadcrumbs'>) {
  const [trail, setTrail] = useState<RootBreadcrumb[]>([]);

  return (
    <SetTrailContext value={setTrail}>
      <RootShell {...shellProps} breadcrumbs={trail}>
        {children}
      </RootShell>
    </SetTrailContext>
  );
}

/**
 * Tells the header where this page sits. Renders nothing, and clears the trail
 * when the page goes away so the next page never shows a stale one.
 */
export function SetBreadcrumbs({ items }: { items: RootBreadcrumb[] }) {
  const setTrail = useContext(SetTrailContext);
  // A new array arrives on every render; compare by value so the effect runs
  // only when the trail actually changes.
  const key = JSON.stringify(items);

  useEffect(() => {
    setTrail(JSON.parse(key) as RootBreadcrumb[]);
    return () => setTrail([]);
  }, [key, setTrail]);

  return null;
}
