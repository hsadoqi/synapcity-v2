import { definePreview } from '@storybook/nextjs-vite';
import addonTheme, { withThemeByClassName } from '@storybook/addon-themes';
import addonDocs from '@storybook/addon-docs';
import a11yAddOn from '@storybook/addon-a11y';
import type { Renderer } from 'storybook/internal/types';

import { defaultTheme } from './theme';
import '../styles/globals.css';

export default definePreview({
  addons: [addonDocs(), a11yAddOn(), addonTheme()],
  tags: ['autodocs'],
  parameters: {
    // Real accessibility violations fail the test run rather than only warning
    // (plan §7.4: "Do not globally suppress accessibility findings").
    a11y: { test: 'error' },
    docs: {
      theme: defaultTheme,
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
  ],
});
