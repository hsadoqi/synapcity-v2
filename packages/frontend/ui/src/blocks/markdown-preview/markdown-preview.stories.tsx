import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { MarkdownPreview } from '@synapcity/frontend-ui/blocks/markdown-preview';

const meta = {
  title: 'Blocks/MarkdownPreview',
  component: MarkdownPreview,
  parameters: { layout: 'centered' },
  args: {
    title: 'Launch Checklist',
    lede: 'Ship with confidence by running through the five-point review.',
    bullets: ['Verify preview URL', 'Run smoke suite', 'Tag the release'],
    bordered: false,
  },
} satisfies Meta<typeof MarkdownPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Bordered: Story = { args: { bordered: true } };

export const WithCode: Story = { args: { code: 'pnpm verify' } };

/** Only the title is required; it falls back to "Heading". */
export const TitleOnly: Story = {
  args: { title: undefined, lede: undefined, bullets: [] },
};
