import type { Metadata } from 'next';
import '@/styles/globals.css';
import { fontVariables } from '@synapcity/frontend-fonts/next';
import { RootProviders } from '@/components/providers';
import { NextShellNavigation } from '@synapcity/frontend-shells/next';
import { createMetadata } from '@synapcity/frontend-site/metadata';
import { getCurrentUser } from '../features/auth/server';
import { cn } from '../lib/utils';
import { RootHead } from './root-head';
import { getAccountPreferences } from '@/features/settings/server/account-preferences';
import {
  parseLookCookieValue,
  LOOK_COOKIE_NAME,
  lookWithAccount,
  pageLanguage,
} from '@synapcity/domain-preferences';
import { lookHtmlAttributes } from '@synapcity/frontend-preferences';
import { cookies } from 'next/headers';

export const metadata: Metadata = createMetadata({
  title: 'Synapcity',
  description: 'A connected workspace for thinking, planning, and doing.',
  siteUrl: process.env.SITE_URL,
});

/**
 * The document, the global styles and the providers every page needs. The page
 * chrome belongs to the route group: `(public)` and `(auth)` use the public
 * shell, `(protected)` the workspace shell. Root `error` and `not-found` bring
 * their own.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const requestLook = parseLookCookieValue(
    (await cookies()).get(LOOK_COOKIE_NAME)?.value,
  );
  // ADR-0010: the account's preferences follow the person to every page, not
  // only the settings page. A failed read leaves this browser's own copy.
  const stored = user ? await getAccountPreferences(user.id) : undefined;
  const account = stored?.preferences ?? null;
  const look = lookWithAccount(requestLook, account);
  const lookAttributes = look ? lookHtmlAttributes(look) : undefined;
  return (
    <html
      lang={pageLanguage(account?.regional.language ?? 'en')}
      {...lookAttributes}
      className={cn(fontVariables, lookAttributes?.className)}
      suppressHydrationWarning
    >
      <RootHead />
      <body>
        <RootProviders
          user={user}
          account={account}
          deviceTimeZone={stored?.deviceTimezone ?? null}
        >
          <NextShellNavigation>{children}</NextShellNavigation>
        </RootProviders>
      </body>
    </html>
  );
}
