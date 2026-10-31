import localFont from 'next/font/local';
import { Inter } from 'next/font/google';

// next/font runs at build time: each call needs literal arguments at module
// scope, and `src` is resolved relative to this file, so the font files sit
// beside it and the variable names cannot come from a shared constant. The
// names are the ones the typography tokens read (frontend-tailwind-config,
// shared-styles.css); a test keeps the two in step.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const geistSans = localFont({
  src: './GeistVF.woff',
  variable: '--font-geist-sans',
});
const geistMono = localFont({
  src: './GeistMonoVF.woff',
  variable: '--font-geist-mono',
  // Code only: fetch it when a code element first renders, not on every page.
  preload: false,
});

/**
 * The class names that define the font variables the typography tokens read.
 * A host puts them on `<html>`: the root layout does, and so does `global-error`,
 * which replaces the layout and so has to bring its own. Storybook adds them
 * to `document.documentElement` one by one, because `classList.add` throws on a
 * string with a space in it.
 */
export const fontVariableClasses: readonly string[] = [
  inter.variable,
  geistSans.variable,
  geistMono.variable,
];

/** The same classes as one `className` string. */
export const fontVariables = fontVariableClasses.join(' ');
