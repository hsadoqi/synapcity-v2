'use client';

import {
  ModeProvider,
  PreferencesProvider,
  type SaveAccountPreferences,
} from '@synapcity/frontend-preferences';
import type { Look, PreferencesSession } from '@synapcity/domain-preferences';

/**
 * The person's preferences on every page (ADR-0010): colour mode, and the one
 * preferences runtime every consumer reads. The server layout reads the
 * session and the request's look and passes them in; nothing here fetches.
 */
export const RootPreferencesProvider = ({
  children,
  session,
  look,
  saveAccountPreferences,
}: {
  children: React.ReactNode;
  session: PreferencesSession;
  look: Look | null;
  saveAccountPreferences?: SaveAccountPreferences;
}) => {
  return (
    <ModeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      shareLook
    >
      <PreferencesProvider
        session={session}
        look={look}
        saveAccountPreferences={saveAccountPreferences}
      >
        {children}
      </PreferencesProvider>
    </ModeProvider>
  );
};
