import type { Metadata } from 'next';
import '../styles/globals.css';
import { fontVariables } from './fonts';
import RootProviders from '../components/providers/root-providers';
import { AuthStatus } from '@/features/auth/components/auth-status';
import { RootShell } from '@synapcity/frontend-ui/blocks/root-shell';
import { createMetadata } from '@synapcity/frontend-site/metadata';
import { UserProvider } from '@/features/auth/client';
import { getCurrentUser } from '@/features/auth/server';
import { appearanceBootScript } from '@/features/settings/shared/appearance-attributes';
import { fontBootScript } from '@/features/settings/shared/font-preferences';
import { AccountPreferencesSync } from '@/features/settings/components/account-preferences-sync';
import { getAccountPreferences } from '@/features/settings/server/account-preferences';
import { pageLanguage } from '@/features/settings/types/regional';
import { accountLinksFor } from '@/lib/routing/user-paths';
export const metadata: Metadata = createMetadata({
  siteUrl: process.env.SITE_URL,
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  // ADR-0010: the account's preferences follow the person to every page, not
  // only the settings page. A failed read leaves this browser's own copy.
  const stored = user ? await getAccountPreferences(user.id) : undefined;
  const account = stored?.preferences ?? null;
  return (
    <html
      lang={pageLanguage(account?.regional.language ?? 'en')}
      className={fontVariables}
      suppressHydrationWarning
    >
      <head>
        {/* Applies saved text size, contrast and motion before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: appearanceBootScript }} />
        {/* Applies saved font choices, and fetches only those, before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: fontBootScript }} />
      </head>
      <body>
        <AccountPreferencesSync preferences={account} />
        <RootProviders>
          <UserProvider user={user}>
            <RootShell
              account={user ? accountLinksFor(user.id) : null}
              headerActions={<AuthStatus variant="header" />}
            >
              {children}
            </RootShell>
          </UserProvider>
        </RootProviders>
      </body>
    </html>
  );
}
