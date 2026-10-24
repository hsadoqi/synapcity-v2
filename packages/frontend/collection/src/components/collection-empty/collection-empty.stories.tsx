import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { FileText } from 'lucide-react';

import { sampleEmptyCopy } from '../../testing';
import { CollectionEmpty } from './collection-empty';

const meta: Meta<typeof CollectionEmpty> = {
  title: 'Collection/CollectionEmpty',
  component: CollectionEmpty,
  tags: ['autodocs'],
  args: {
    icon: FileText,
    singular: 'document',
    copy: sampleEmptyCopy,
    onCreate: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof CollectionEmpty>;

export const Default: Story = {};

/** Without `onCreate` the empty state offers no button. */
export const WithoutCreate: Story = { args: { onCreate: undefined } };
