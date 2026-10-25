import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import '../styles/globals.css';
import { fontVariables } from './fonts';
import RootProviders from '../components/providers/root-providers';
import { AuthStatus } from '@/features/auth/components/auth-status';
import { BreadcrumbRootShell } from '@/components/breadcrumbs';
import { STAND_IN_SIDEBAR } from '@/components/stand-in-sidebar';
import { NextShellNavigation } from '@synapcity/frontend-shells/next';
import { createMetadata } from '@synapcity/frontend-site/metadata';
import { UserProvider } from '@/components/user-provider/user-provider';
import { getCurrentUser } from '@/features/auth/server';
import {
  appearanceBootScript,
  fontBootScript,
  modeBootScript,
  themeShapeBootScript,
  lookHtmlAttributes,
} from '@synapcity/frontend-preferences';
import { AccountPreferencesSync } from '@synapcity/features-settings/frontend';
import { getAccountPreferences } from '@/features/settings/server/account-preferences';
import {
  LOOK_COOKIE_NAME,
  lookWithAccount,
  pageLanguage,
  parseLookCookieValue,
} from '@synapcity/domain-preferences';
import { accountLinksFor } from '@/lib/routing/user-paths';
import { cn } from '@/lib/utils';

export const metadata: Metadata = createMetadata({
  title: 'Synapcity',
  description: 'A connected workspace for thinking, planning, and doing.',
  siteUrl: process.env.SITE_URL,
});

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
      style={lookAttributes?.style}
      suppressHydrationWarning
    >
      <head>
        {/* Applies the mode chosen on any host before first paint, ahead of next-themes. */}
        <script dangerouslySetInnerHTML={{ __html: modeBootScript }} />
        {/* Applies saved contrast and motion before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: appearanceBootScript }} />
        {/* Applies saved font choices, and fetches only those, before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: fontBootScript }} />
        {/* Applies the saved text size, corner radius and density before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: themeShapeBootScript }} />
      </head>
      <body>
        <AccountPreferencesSync preferences={account} />
        <RootProviders>
          <UserProvider user={user}>
            <NextShellNavigation>
              <BreadcrumbRootShell
                account={user ? accountLinksFor(user.id) : null}
                headerActions={<AuthStatus variant="header" />}
                sidebar={STAND_IN_SIDEBAR}
              >
                {children}
              </BreadcrumbRootShell>
            </NextShellNavigation>
          </UserProvider>
        </RootProviders>
      </body>
    </html>
  );
}
