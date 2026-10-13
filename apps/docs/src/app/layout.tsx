import type { Metadata } from 'next';
import localFont from 'next/font/local';
import '../styles/globals.css';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import RootProviders from './providers';
import { RootShell } from '@synapcity/frontend-ui/blocks/root-shell';
import { createMetadata } from '@synapcity/frontend-site/metadata';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const geistSans = localFont({
  src: '../lib/fonts/GeistVF.woff',
  variable: '--font-geist-sans',
});
const geistMono = localFont({
  src: '../lib/fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
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
      <body>
        <RootProviders>
          <RootShell>{children}</RootShell>
        </RootProviders>
      </body>
    </html>
  );
}
