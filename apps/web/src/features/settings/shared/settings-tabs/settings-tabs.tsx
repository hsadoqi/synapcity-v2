'use client';

import {
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
} from 'react';
import { Tabs, TabsContent } from '@synapcity/frontend-ui/core/tabs';
import tabs from '../../lib/data/tabs';
import { SettingsTabsHeader } from './settings-tab-header';
import { ScrollArea, ScrollBar } from '@synapcity/frontend-ui/core/scroll-area';

export const SettingsTabs = () => {
  // null until the URL hash is read. Starting on 'theme' drew and loaded the
  // Theme tab, then swapped to the tab a link named (#regional), so the
  // content flashed and the page height jumped twice. The hash never reaches
  // the server, so server and first client render both show no panel.
  const [tab, setTab] = useState<string | null>(null);
  // A tab stays mounted once opened, so a draft in it (the Theme tab's unsaved
  // choices) survives a visit to another tab. Tabs never opened still never load.
  const [visited, setVisited] = useState<ReadonlySet<string>>(() => new Set());
  if (tab !== null && !visited.has(tab)) setVisited(new Set(visited).add(tab));

  useEffect(() => {
    const sync = () => {
      const value = window.location.hash.slice(1);
      setTab(tabs.some((tab) => tab.value === value) ? value : 'account');
    };

    sync();
    window.addEventListener('hashchange', sync);

    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const lazyTabs = useMemo(
    () =>
      tabs.map((t) => ({
        value: t.value,
        Component: lazy(async () => ({
          default: (await t.component()) as unknown as ComponentType,
        })),
      })),
    [],
  );

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => {
        setTab(String(value));
        window.location.hash = String(value);
      }}
      className="flex min-h-0 w-full flex-1 flex-col gap-6"
    >
      <SettingsTabsHeader onTabChange={setTab} />
      <ScrollArea className="min-h-0 w-full flex-1 overflow-x-auto">
        {lazyTabs.map(({ value, Component }) => (
          <TabsContent
            key={value}
            value={value}
            keepMounted={visited.has(value)}
            className="flex h-full flex-col"
          >
            <Suspense fallback={null}>
              <Component />
            </Suspense>
          </TabsContent>
        ))}
        <ScrollBar orientation="horizontal" className="bg-transparent" />
      </ScrollArea>
    </Tabs>
  );
};
