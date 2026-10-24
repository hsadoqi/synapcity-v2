'use client';

import {
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import { Tabs, TabsContent } from '@synapcity/frontend-ui/core/tabs';
import tabs from '../../lib/data';
import { settingsTabItems } from '../../lib/data/tab-items';
import { SettingsTabsHeader } from './settings-tab-header';
import { SettingsTabActive } from './settings-tab-active';
import { useRoomyLayout } from '../../hooks/use-settings-layout';

export const SettingsTabs = ({
  header,
  footer,
  accountTab,
}: {
  /** The page's heading, above the tabs: atop the side navigation when roomy. */
  header?: ReactNode;
  /** The page's closing note: under the side navigation when roomy, else last. */
  footer?: ReactNode;
  /** Host-owned Account content, loaded only when that tab is visited. */
  accountTab?: () => Promise<ComponentType>;
}) => {
  // A side navigation on a roomy screen, a strip across the top otherwise. The
  // orientation is the markup's, not only the look's: the arrow keys follow it.
  const roomy = useRoomyLayout();
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
      setTab(
        settingsTabItems.some((tab) => tab.value === value) ? value : 'account',
      );
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
          default:
            t.value === 'account' && accountTab
              ? await accountTab()
              : await t.component(),
        })),
      })),
    [accountTab],
  );

  return (
    <Tabs
      value={tab}
      orientation={roomy ? 'vertical' : 'horizontal'}
      onValueChange={(value) => {
        setTab(String(value));
        window.location.hash = String(value);
      }}
      className="flex w-full flex-1 flex-col gap-6 roomy:min-h-0 roomy:flex-row roomy:gap-10"
    >
      {/* The sidebar when roomy. Otherwise its parts join the page's one
          column (contents), so the tab strip can stick while the page scrolls:
          sticky holds only within its parent box. */}
      <div className="contents roomy:flex roomy:w-56 roomy:shrink-0 roomy:flex-col roomy:gap-6">
        {header}
        <SettingsTabsHeader onTabChange={setTab} />
        {roomy && footer && <div className="mt-auto">{footer}</div>}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-6 roomy:min-h-0">
        {lazyTabs.map(({ value, Component }) => (
          <TabsContent
            key={value}
            value={value}
            keepMounted={visited.has(value)}
            // min-h-0, not h-full: the panel takes the room left under the tab
            // bar. h-full made it as tall as the whole Tabs box, bar included, so
            // the card ran under the page footer.
            className="flex flex-col roomy:min-h-0"
          >
            <SettingsTabActive value={tab === value}>
              <Suspense fallback={null}>
                <Component />
              </Suspense>
            </SettingsTabActive>
          </TabsContent>
        ))}
        {!roomy && footer}
      </div>
    </Tabs>
  );
};
