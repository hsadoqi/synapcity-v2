import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { emptyRecords } from '@synapcity/domain-prototypes';

import { SEED_NOW, seededWorkspace } from '../../../testing/seed';
import { WidgetFrame } from '../../../testing/widget-frame';
import { FeedBody } from './index';

const meta: Meta<typeof FeedBody> = {
  title: 'Dashboards/Widgets/Recent activity',
  component: FeedBody,
  decorators: [
    (Story) => (
      <WidgetFrame>
        <Story />
      </WidgetFrame>
    ),
  ],
  args: {
    activity: seededWorkspace().records.activity,
    limit: 6,
    now: SEED_NOW,
  },
};

export default meta;
type Story = StoryObj<typeof FeedBody>;

export const Default: Story = {};

export const NoActivity: Story = {
  args: { activity: emptyRecords().activity },
};
