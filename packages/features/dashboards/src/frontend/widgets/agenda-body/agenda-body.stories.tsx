import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { emptyRecords } from '@synapcity/domain-prototypes';

import { SEED_NOW, seededWorkspace } from '../../../testing';
import { WidgetFrame } from '../../../testing';
import { AgendaBody } from './index';

const meta: Meta<typeof AgendaBody> = {
  title: 'Dashboards/Widgets/Agenda',
  component: AgendaBody,
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
type Story = StoryObj<typeof AgendaBody>;

export const Default: Story = {};

export const NothingScheduled: Story = {
  args: { events: emptyRecords().event },
};
