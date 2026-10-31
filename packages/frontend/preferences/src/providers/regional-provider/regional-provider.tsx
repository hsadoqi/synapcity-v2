'use client';

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  parseImport,
  regionalDefaults,
  resolveDateTimeFormatting,
  type DateTimeFormatting,
  type RegionalSettings,
} from '@synapcity/domain-preferences';
import {
  deviceTimezone,
  onStoredPreferencesChange,
  readStoredPreferences,
} from '../../store';

type ServerRegional = {
  regional: RegionalSettings | null;
  deviceTimeZone: string | null;
};

const ServerRegionalContext = createContext<ServerRegional>({
  regional: null,
  deviceTimeZone: null,
});

/**
 * Hands the server's view of the regional settings to `useDateTimeFormatting`
 * for the server render and hydration, so dates written on the server match
 * the browser's first render. After that the browser's saved copy and its own
 * zone take over.
 *
 * Without it (Storybook, tests) the defaults are used, in UTC until hydration.
 */
export function RegionalProvider({
  regional,
  deviceTimeZone,
  children,
}: {
  /** The account's regional settings; null when signed out or nothing is saved. */
  regional: RegionalSettings | null;
  /** The zone `system` stands for on the server: the account's last device zone. */
  deviceTimeZone: string | null;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({ regional, deviceTimeZone }),
    [regional, deviceTimeZone],
  );
  return (
    <ServerRegionalContext.Provider value={value}>
      {children}
    </ServerRegionalContext.Provider>
  );
}

function readStored() {
  try {
    return readStoredPreferences();
  } catch {
    return null;
  }
}

/** Stands for "rendering on the server or hydrating": there is no browser copy to read yet. */
const onServer = () => undefined;

function storedRegional(stored: string | null): RegionalSettings | null {
  if (!stored) return null;
  try {
    return parseImport(JSON.parse(stored)).settings.regional;
  } catch {
    return null;
  }
}

/**
 * How dates and times are written for this person: language, zone, hour
 * cycle, date order and week start, from their regional settings. It follows
 * changes from the settings page in this tab and in others, and needs no
 * provider in the browser; `RegionalProvider` only supplies the server render.
 */
export function useDateTimeFormatting(): DateTimeFormatting {
  const server = useContext(ServerRegionalContext);
  const stored = useSyncExternalStore(
    onStoredPreferencesChange,
    readStored,
    onServer,
  );
  return useMemo(() => {
    if (stored === undefined) {
      return resolveDateTimeFormatting(
        server.regional ?? regionalDefaults,
        server.deviceTimeZone,
      );
    }
    return resolveDateTimeFormatting(
      storedRegional(stored) ?? server.regional ?? regionalDefaults,
      deviceTimezone(),
    );
  }, [stored, server]);
}
