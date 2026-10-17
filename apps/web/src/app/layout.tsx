import type { Metadata } from 'next';
import localFont from 'next/font/local';
import '../styles/globals.css';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import RootProviders from '../components/providers/root-providers';
import { AuthStatus } from '@/features/auth/components/auth-status';
import { RootShell } from '@synapcity/frontend-ui/blocks/root-shell';
import { createMetadata } from '@synapcity/frontend-site/metadata';
import { UserProvider } from '@/features/auth/client/user-provider';
import { getCurrentUser } from '@/features/auth/server/session';
import { accountLinksFor } from '@/lib/routing/user-paths';
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const geistSans = localFont({
  src: '../lib/fonts/GeistVF.woff',
  variable: '--font-geist-sans',
});
const geistMono = localFont({
  src: '../lib/fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  // Code only: fetch it when a code element first renders, not on every page.
  preload: false,
});

export const metadata: Metadata = createMetadata();
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  return (
    <html
      lang="en"
      className={cn(inter.variable, geistSans.variable, geistMono.variable)}
      suppressHydrationWarning
    >
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
