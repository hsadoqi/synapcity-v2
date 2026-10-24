import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { emptyRecords } from '@synapcity/domain-prototypes';

import { SEED_NOW, seededWorkspace } from '../../../testing';
import { WidgetFrame } from '../../../testing';
import { CalendarBody } from './index';

const meta: Meta<typeof CalendarBody> = {
  title: 'Dashboards/Widgets/Schedule',
  component: CalendarBody,
  decorators: [
    (Story) => (
      <WidgetFrame>
        <Story />
      </WidgetFrame>
    ),
  ],
  args: { events: seededWorkspace().records.event, now: SEED_NOW },
};

export default meta;
type Story = StoryObj<typeof CalendarBody>;

export const Default: Story = {};

export const NothingScheduled: Story = {
  args: { events: emptyRecords().event },
};
