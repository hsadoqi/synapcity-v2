import { definePreview } from '@storybook/nextjs-vite';
import addonTheme, { withThemeByClassName } from '@storybook/addon-themes';
import addonDocs from '@storybook/addon-docs';
import a11yAddOn from '@storybook/addon-a11y';
import type { Renderer } from 'storybook/internal/types';
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';
import { ThemedDocsContainer } from './docs-container';
import { storyModeAction } from './story-mode';
import { useEffect } from 'react';
import { ModeProvider, useMode } from '@synapcity/frontend-preferences';
import '../styles/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

// The same Geist files and variable names as the apps (apps/web/src/app/fonts.ts), so stories
// render the type the app does. The names are the ones the typography tokens read
// (shared-styles.css): --font-geist-sans for headings, not Google's --font-geist.
const geist = localFont({
  src: '../../web/src/lib/fonts/GeistVF.woff',
  variable: '--font-geist-sans',
});

const geistMono = localFont({
  src: '../../web/src/lib/fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  preload: false,
});

const fontVariables = [inter.variable, geist.variable, geistMono.variable];

// On <html>, like the apps. The role tokens (--font-body and the rest) are declared on :root, and
// a var() resolves where it is declared, so variables set on a wrapper below :root are invisible
// to them and every control (font-ui reads --font-body) would fall back to system-ui.
if (typeof document !== 'undefined') {
  document.documentElement.classList.add(...fontVariables);
}
type ToolbarTheme = 'light' | 'dark';

/** addon-themes keeps the toolbar choice in `globals.theme`; dark until one is picked. */
function toolbarTheme(value: unknown): ToolbarTheme {
  return value === 'light' ? 'light' : 'dark';
}

/**
 * The toolbar owns the mode: when it changes, next-themes is told, so the class, color-scheme and
 * useMode() all agree. A ModeToggle inside a story can still change it until the toolbar moves.
 */
function FollowToolbarTheme({ theme }: { theme: ToolbarTheme }) {
  const { setMode } = useMode();
  useEffect(() => {
    setMode(theme);
  }, [theme, setMode]);
  return null;
}

export default definePreview({
  addons: [addonDocs(), a11yAddOn(), addonTheme()],
  tags: ['autodocs'],
  parameters: {
    // Real accessibility violations fail the test run rather than only warning
    // (plan §7.4: "Do not globally suppress accessibility findings").
    a11y: { test: 'error' },
    docs: {
      container: ThemedDocsContainer,
      canvas: { additionalActions: [storyModeAction] },
      toc: {
        disable: false,
      },
    },
  },
  decorators: [
    withThemeByClassName<Renderer>({
      themes: {
        light: 'light',
        dark: 'dark',
      },
      defaultTheme: 'dark',
    }),
    (Story, context) => {
      const theme = toolbarTheme(context.globals.theme);

      // attribute="class" matches the apps; without it next-themes writes data-theme and an
      // OS-derived color-scheme that contradict the toolbar's class. Its own storage key keeps a
      // mode saved while browsing the web app out of the stories.
      return (
        <div className="size-full">
          {/* next-themes injects an inline script to avoid a first-paint flash. Nothing server-renders
              here and addon-themes already sets the class, so mark it as a data block: React stops
              warning about a script that could never run on the client. */}
          <ModeProvider
            attribute="class"
            initialMode={theme}
            enableSystem={false}
            storageKey="storybook-mode"
            scriptProps={{ type: 'application/json' }}
          >
            <FollowToolbarTheme theme={theme} />
            <Story />
          </ModeProvider>
        </div>
      );
    },
  ],
});
