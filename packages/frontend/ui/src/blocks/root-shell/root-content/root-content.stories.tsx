import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { RootContent } from '@synapcity/frontend-ui/blocks/root-shell/root-content';

const meta: Meta<typeof RootContent> = {
  title: 'Blocks/RootContent',
  component: RootContent,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof RootContent>;

/** The page's single `main` landmark, and the target of the skip link. */
export const Default: Story = {
  args: { children: <p className="text-xs">Page content</p> },
};
