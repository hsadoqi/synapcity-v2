import { definePreview } from '@storybook/nextjs-vite';
import addonTheme, { withThemeByClassName } from '@storybook/addon-themes';
import addonDocs from '@storybook/addon-docs';
import a11yAddOn from '@storybook/addon-a11y';
import type { Renderer } from 'storybook/internal/types';
import { Inter, Geist, Geist_Mono } from 'next/font/google';
import { ThemedDocsContainer } from './docs-container';
import { storyModeAction } from './story-mode';
import { ModeProvider } from '@synapcity/frontend-ui/providers/mode-provider';
import '../styles/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
});

const fontVariables = [inter.variable, geist.variable, geistMono.variable].join(
  ' ',
);
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
    (Story) => (
      <div className={`${fontVariables} size-full`}>
        {/* next-themes injects an inline script to avoid a first-paint flash. Nothing server-renders
            here and addon-themes already sets the class, so mark it as a data block: React stops
            warning about a script that could never run on the client. */}
        <ModeProvider scriptProps={{ type: 'application/json' }}>
          <Story />
        </ModeProvider>
      </div>
    ),
  ],
});
