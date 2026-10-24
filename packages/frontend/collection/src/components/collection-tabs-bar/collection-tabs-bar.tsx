'use client';

import { TabsList, TabsTrigger } from '@synapcity/frontend-ui/core/tabs';

/** The value of the optional overview tab; no collection tab may use it as its id. */
export const OVERVIEW_TAB = 'overview';

type CollectionTabsBarProps = {
  /** Adds an overview tab, with this label, before the collection tabs. */
  overviewLabel?: string;
  tabs: { id: string; label: string }[];
  /** Whatever the caller wants beside the tabs, e.g. its create actions. */
  actions?: React.ReactNode;
};

/**
 * The tab bar above the collections. Which tabs it shows, and what sits
 * beside them, is up to the caller. It must be rendered inside `Tabs`.
 */
export function CollectionTabsBar({
  overviewLabel,
  tabs,
  actions,
}: CollectionTabsBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <TabsList>
        {overviewLabel && (
          <TabsTrigger value={OVERVIEW_TAB}>{overviewLabel}</TabsTrigger>
        )}
        {tabs.map(({ id, label }) => (
          <TabsTrigger key={id} value={id}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      {actions}
    </div>
  );
}
