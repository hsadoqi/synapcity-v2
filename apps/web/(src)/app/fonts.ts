import localFont from 'next/font/local';
import { Inter } from 'next/font/google';

import { cn } from '../../src/lib/utils';

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

/**
 * The classes that define the font variables the typography tokens read. The
 * root layout puts them on `<html>`, and so does `global-error`, which replaces
 * the layout and so has to bring its own. They live here, in one place, because
 * a layout may not export them and both need them. To add a selectable font,
 * add its loader here (ADR-0003).
 */
export const fontVariables = cn(
  inter.variable,
  geistSans.variable,
  geistMono.variable,
);
