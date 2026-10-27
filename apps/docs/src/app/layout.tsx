import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import localFont from 'next/font/local';
import '../styles/globals.css';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import RootProviders from './providers';
import { RootShell } from '@synapcity/frontend-shells';
import { NextShellNavigation } from '@synapcity/frontend-shells/next';
import { createMetadata } from '@synapcity/frontend-site/metadata';
import {
  appearanceBootScript,
  fontBootScript,
  modeBootScript,
  themeShapeBootScript,
  lookHtmlAttributes,
} from '@synapcity/frontend-preferences';
import {
  LOOK_COOKIE_NAME,
  parseLookCookieValue,
} from '@synapcity/domain-preferences';

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

export const metadata: Metadata = createMetadata({ title: 'Synapcity Docs' });

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const look = parseLookCookieValue(
    (await cookies()).get(LOOK_COOKIE_NAME)?.value,
  );
  const lookAttributes = look ? lookHtmlAttributes(look) : undefined;
  return (
    <html
      lang="en"
      {...lookAttributes}
      className={cn(
        inter.variable,
        geistSans.variable,
        geistMono.variable,
        lookAttributes?.className,
      )}
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
        <RootProviders>
          <NextShellNavigation>
            <RootShell>{children}</RootShell>
          </NextShellNavigation>
        </RootProviders>
      </body>
    </html>
  );
}
