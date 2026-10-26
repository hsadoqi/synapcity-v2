import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { sampleSummaries } from '../../../testing';
import { toCollectionItem } from '../../utils';
import { DocumentPreview } from './document-preview';

const meta: Meta<typeof DocumentPreview> = {
  title: 'Documents/DocumentPreview',
  component: DocumentPreview,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="flex max-w-xs flex-col gap-2 text-sm">
        <Story />
      </div>
    ),
  ],
  args: { item: toCollectionItem(sampleSummaries[0]!, '/u1/home') },
};

export default meta;
type Story = StoryObj<typeof DocumentPreview>;

/** A document with tags and a description. */
export const Default: Story = {};

/** A document with no description, in no space. */
export const Plain: Story = {
  args: { item: toCollectionItem(sampleSummaries[6]!, '/u1/home') },
};
