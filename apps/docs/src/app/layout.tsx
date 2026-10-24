import type { Metadata } from 'next';
import localFont from 'next/font/local';
import '../styles/globals.css';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import RootProviders from './providers';
import { RootShell } from '@synapcity/frontend-ui/blocks/root-shell';
import { createMetadata } from '@synapcity/frontend-site/metadata';
import {
  appearanceBootScript,
  fontBootScript,
  modeBootScript,
  themeShapeBootScript,
} from '@synapcity/frontend-preferences';

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(inter.variable, geistSans.variable, geistMono.variable)}
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
          <RootShell>{children}</RootShell>
        </RootProviders>
      </body>
    </html>
  );
}
