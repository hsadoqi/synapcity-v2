import tailwindcss from '@tailwindcss/vite';
import type { StorybookConfig } from '@storybook/nextjs-vite';
import { defineMain } from '@storybook/nextjs-vite/node';

const config: StorybookConfig = {
  stories: [
    '../../../packages/frontend/ui/src/components/**/*.stories.@(ts|tsx)',
    '../../../packages/frontend/ui/src/blocks/**/*.stories.@(ts|tsx)',
    '../../../packages/frontend/preferences/src/**/*.stories.@(ts|tsx)',
    '../../../packages/frontend/collection/src/**/*.stories.@(ts|tsx)',
    '../../../packages/frontend/forms/src/**/*.stories.@(ts|tsx)',
    '../../../packages/frontend/shells/src/**/*.stories.@(ts|tsx)',
    '../../../packages/features/auth/src/**/*.stories.@(ts|tsx)',
    '../../../packages/features/dashboards/src/**/*.stories.@(ts|tsx)',
    '../../../packages/features/documents/src/**/*.stories.@(ts|tsx)',
    '../../../packages/features/spaces/src/**/*.stories.@(ts|tsx)',
    '../../../packages/features/settings/src/**/*.stories.@(ts|tsx)',
  ],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
    '@storybook/addon-themes',
  ],
  staticDirs: ['../public'],
  typescript: {
    // Storybook's default `react-docgen` is used on purpose. `react-docgen-typescript` would
    // document props inherited from external types, but its Vite plugin
    // (@joshwooding/vite-plugin-react-docgen-typescript, latest 0.9.0) declares
    // `typescript: >=4.3.0 <7 || >=7.1.0-0 <8`, so on the pinned TypeScript 7.0.x it crashes
    // at startup (`ts.sys` is undefined). Revisit when the repo moves to TypeScript >=7.1.
  },
  framework: {
    name: '@storybook/nextjs-vite',
    options: {},
  },
  async viteFinal(viteConfig) {
    const { mergeConfig } = await import('vite');
    return mergeConfig(viteConfig, {
      plugins: [tailwindcss()],
    });
  },
};

export default defineMain(config);
