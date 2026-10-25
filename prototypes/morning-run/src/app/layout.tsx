import type { Metadata, Viewport } from 'next';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { cookies } from 'next/headers';
import type { ReactNode } from 'react';

import { ViewProvider } from '@/components/view-provider';
import { VIEW_COOKIE, VIEW_META, parseView } from '@/lib/view';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Runs', template: '%s · Runs' },
  description:
    'Short guided check-ins for your whole life, not just work. A few easy questions, then your day is set up.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const view = parseView((await cookies()).get(VIEW_COOKIE)?.value);
  return (
    <html
      lang="en"
      data-view={view}
      data-tone={VIEW_META[view].tone}
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ViewProvider initial={view}>{children}</ViewProvider>
      </body>
    </html>
  );
}
