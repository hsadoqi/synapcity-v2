import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { sampleSummaries } from '../../../testing';
import { toCollectionItem } from '../../utils/collection-item';
import { DashboardPreview } from './dashboard-preview';

const meta: Meta<typeof DashboardPreview> = {
  title: 'Dashboards/DashboardPreview',
  component: DashboardPreview,
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
type Story = StoryObj<typeof DashboardPreview>;

/** A dashboard with tags and a description. */
export const Default: Story = {};

/** A dashboard with no description, in no space. */
export const Plain: Story = {
  args: { item: toCollectionItem(sampleSummaries[6]!, '/u1/home') },
};
