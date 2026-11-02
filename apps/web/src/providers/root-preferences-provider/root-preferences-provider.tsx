'use client';

import { AccountPreferencesSync } from '@synapcity/features-settings/frontend';
import {
  ModeProvider,
  RegionalProvider,
} from '@synapcity/frontend-preferences';
import type { AccountPreferences } from '@synapcity/domain-preferences';

/**
 * The person's preferences on every page (ADR-0010). The server layout reads
 * them and passes them in; nothing here fetches.
 */
export const RootPreferencesProvider = ({
  children,
  account,
  deviceTimeZone,
}: {
  children: React.ReactNode;
  account: AccountPreferences | null;
  deviceTimeZone: string | null;
}) => {
  return (
    <ModeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      shareLook
    >
      <AccountPreferencesSync preferences={account} />
      {/* Dates written on the server use the account's settings and its last
          device zone, so they match the browser's first render. */}
      <RegionalProvider
        regional={account?.regional ?? null}
        deviceTimeZone={deviceTimeZone}
      >
        {children}
      </RegionalProvider>
    </ModeProvider>
  );
};
