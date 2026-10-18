'use client';

import { Tabs, TabsList, TabsTrigger } from '@synapcity/frontend-ui/core/tabs';

/** The value of the optional overview tab; no collection tab may use it as its id. */
export const OVERVIEW_TAB = 'overview';

type CollectionTabsBarProps = {
  tab: string;
  onTabChange: (tab: string) => void;
  /** Adds an overview tab, with this label, before the collection tabs. */
  overviewLabel?: string;
  tabs: { id: string; label: string }[];
};

/** The tab bar above the collections. Which tabs it shows is up to the caller. */
export function CollectionTabsBar({
  tab,
  onTabChange,
  overviewLabel,
  tabs,
}: CollectionTabsBarProps) {
  return (
    <div
      role="group"
      aria-label="Collections"
      className="flex flex-wrap items-center gap-3 rounded-md border border-dashed border-border bg-muted/40 p-2"
    >
      <Tabs value={tab} onValueChange={(value) => onTabChange(String(value))}>
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
      </Tabs>
      {/* TODO: Add dynamic toggle items here for each filter applied, e.g. "In Space" or "Pinned" */}
    </div>
  );
}
