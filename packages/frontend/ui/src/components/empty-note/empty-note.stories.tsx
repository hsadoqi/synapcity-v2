import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { EmptyNote } from '@synapcity/frontend-ui/components/empty-note';

const meta: Meta<typeof EmptyNote> = {
  title: 'Components/EmptyNote',
  component: EmptyNote,
  tags: ['autodocs'],
  args: { children: 'Nothing pinned yet. Pin a page to keep it within reach.' },
};

export default meta;
type Story = StoryObj<typeof EmptyNote>;

/**
 * A small dashed note for a section with nothing in it yet. For a whole page
 * or list with nothing in it, use `Empty` from `core/empty` instead.
 */
export const Default: Story = {};
