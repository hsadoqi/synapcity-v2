'use client';

import {
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
} from 'react';
import { Tabs, TabsContent } from '@synapcity/frontend-ui/components/ui/tabs';
import tabs from '../../lib/data/tabs';
import { SettingsTabsHeader } from './settings-tab-header';
import {
  ScrollArea,
  ScrollBar,
} from '@synapcity/frontend-ui/components/ui/scroll-area';

export const SettingsTabs = () => {
  const [tab, setTab] = useState('theme');

  useEffect(() => {
    const sync = () => {
      const value = window.location.hash.slice(1);
      setTab(tabs.some((tab) => tab.value === value) ? value : 'theme');
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
      className="flex-1 flex w-full flex-col gap-6 overflow-y-auto"
    >
      <SettingsTabsHeader onTabChange={setTab} />
      <ScrollArea className="w-full overflow-x-auto">
        {lazyTabs.map(({ value, Component }) => (
          <TabsContent key={value} value={value} className="mt-6">
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
