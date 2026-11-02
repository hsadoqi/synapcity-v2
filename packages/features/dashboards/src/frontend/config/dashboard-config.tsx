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
  /**
   * The kinds of record the host tried to read and could not. A link widget
   * that lists one of them shows a failure with Retry, never an empty list.
   */
  unavailableKinds: readonly DashboardLinkItem['kind'][];
  /**
   * The kinds of record the host did not read, because no widget on the
   * dashboard at load time lists them. A widget added later that needs one
   * shows "Loading", and the workspace asks the host to read again once the
   * dashboard has been saved (`onReload`).
   */
  unloadedKinds: readonly DashboardLinkItem['kind'][];
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
  unavailableKinds: [],
  unloadedKinds: [],
  widgetTypes: null,
  persistsStatus: true,
  onReload: null,
  LinkComponent: PlainLink,
};

const DashboardConfigContext = createContext<DashboardConfig>(DEFAULT_CONFIG);

/** Serves the host's choices to the widgets and panels below it. */
export function DashboardConfigProvider({
  items = DEFAULT_CONFIG.items,
  unavailableKinds = DEFAULT_CONFIG.unavailableKinds,
  unloadedKinds = DEFAULT_CONFIG.unloadedKinds,
  widgetTypes = DEFAULT_CONFIG.widgetTypes,
  persistsStatus = DEFAULT_CONFIG.persistsStatus,
  onReload = DEFAULT_CONFIG.onReload,
  LinkComponent = DEFAULT_CONFIG.LinkComponent,
  children,
}: Partial<DashboardConfig> & { children: ReactNode }) {
  const value = useMemo(
    () => ({
      items,
      unavailableKinds,
      unloadedKinds,
      widgetTypes,
      persistsStatus,
      onReload,
      LinkComponent,
    }),
    [
      items,
      unavailableKinds,
      unloadedKinds,
      widgetTypes,
      persistsStatus,
      onReload,
      LinkComponent,
    ],
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
