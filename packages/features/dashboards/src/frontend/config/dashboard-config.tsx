'use client';

import type { WidgetType } from '@synapcity/domain-dashboards';
import {
  createContext,
  useContext,
  useMemo,
  type ComponentType,
  type ReactNode,
} from 'react';

import type { DashboardLinkItem } from '../../contracts';

/** How a link widget renders a link; the host passes its router's link (`next/link`). */
export type DashboardLinkComponent = ComponentType<{
  href: string;
  className?: string;
  children: ReactNode;
}>;

/** What the host decides about a dashboard canvas that the store does not hold. */
export type DashboardConfig = {
  /** The records the link widgets list; the host reads and orders them. */
  items: readonly DashboardLinkItem[];
  /** The widget types the palette offers; every type when null. */
  widgetTypes: readonly WidgetType[] | null;
  /**
   * Whether widgets can be hidden or archived. A host that stores no widget
   * status turns this off: removal deletes the widget (with Undo).
   */
  persistsStatus: boolean;
  /** Re-reads the dashboard (after a conflict); null when the host cannot. */
  onReload: (() => void) | null;
  LinkComponent: DashboardLinkComponent;
};

function PlainLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

const DEFAULT_CONFIG: DashboardConfig = {
  items: [],
  widgetTypes: null,
  persistsStatus: true,
  onReload: null,
  LinkComponent: PlainLink,
};

const DashboardConfigContext = createContext<DashboardConfig>(DEFAULT_CONFIG);

/** Serves the host's choices to the widgets and panels below it. */
export function DashboardConfigProvider({
  items = DEFAULT_CONFIG.items,
  widgetTypes = DEFAULT_CONFIG.widgetTypes,
  persistsStatus = DEFAULT_CONFIG.persistsStatus,
  onReload = DEFAULT_CONFIG.onReload,
  LinkComponent = DEFAULT_CONFIG.LinkComponent,
  children,
}: Partial<DashboardConfig> & { children: ReactNode }) {
  const value = useMemo(
    () => ({ items, widgetTypes, persistsStatus, onReload, LinkComponent }),
    [items, widgetTypes, persistsStatus, onReload, LinkComponent],
  );
  return (
    <DashboardConfigContext.Provider value={value}>
      {children}
    </DashboardConfigContext.Provider>
  );
}

export function useDashboardConfig(): DashboardConfig {
  return useContext(DashboardConfigContext);
}
