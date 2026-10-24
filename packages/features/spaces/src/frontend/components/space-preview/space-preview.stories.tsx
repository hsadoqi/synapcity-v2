import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { sampleSummaries } from '../../../testing';
import { toCollectionItem } from '../../utils';
import { SpacePreview } from './space-preview';

const meta: Meta<typeof SpacePreview> = {
  title: 'Spaces/SpacePreview',
  component: SpacePreview,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="flex max-w-xs flex-col gap-2 text-sm">
        <Story />
      </div>
    ),
  ],
  args: { item: toCollectionItem(sampleSummaries[0]!, 'u1') },
};

export default meta;
type Story = StoryObj<typeof SpacePreview>;

/** A space with tags and a description. */
export const Default: Story = {};

/** A space with neither. */
export const Plain: Story = {
  args: { item: toCollectionItem(sampleSummaries[2]!, 'u1') },
};
