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
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        {/* Applies saved text size, contrast and motion before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: appearanceBootScript }} />
      </head>
      <body>
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
