'use client';

import { configureLookCookie } from '@synapcity/frontend-preferences';
import { ErrorReports } from '@synapcity/frontend-error-reports';
import { RootUiProviders } from '@/providers/root-ui-providers/root-ui-providers';
import { UserProvider } from '@/providers/user-provider';
import { RootPreferencesProvider } from '@/providers/root-preferences-provider/root-preferences-provider';
import { type CurrentUser } from '@synapcity/domain-identity';
import { type AccountPreferences } from '@synapcity/domain-preferences';

// One parent domain lets web and docs show the same look; unset keeps it host-only.
configureLookCookie({
  domain: process.env.NEXT_PUBLIC_PREFERENCES_COOKIE_DOMAIN,
});

type RootProvidersProps = {
  children: React.ReactNode;
  user: CurrentUser | null;
  account: AccountPreferences | null;
  deviceTimeZone: string | null;
};
/**
 * Every client provider the app needs, fed by the server layout. The user is
 * outermost because anything below may read it with `useCurrentUser`.
 */
export function RootProviders({
  children,
  user,
  account,
  deviceTimeZone,
}: RootProvidersProps) {
  return (
    <UserProvider user={user}>
      <RootPreferencesProvider
        account={account}
        deviceTimeZone={deviceTimeZone}
      >
        <RootUiProviders>{children}</RootUiProviders>
      </RootPreferencesProvider>
      {/* Loads nothing unless the person has turned error reports on. */}
      <ErrorReports
        dsn={process.env.NEXT_PUBLIC_SENTRY_DSN}
        environment={process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV}
        release={process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA}
      />
    </UserProvider>
  );
}
