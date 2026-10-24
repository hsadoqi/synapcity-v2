import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { emptyRecords } from '@synapcity/domain-prototypes';
import { fn } from 'storybook/test';

import { SEED_NOW, seededWorkspace } from '../../../testing/seed';
import { WidgetFrame } from '../../../testing/widget-frame';
import { WidgetBody } from './index';

const { composition, records } = seededWorkspace();
const byType = (type: string) =>
  composition.widgets.find((w) => w.type === type)!;

const meta: Meta<typeof WidgetBody> = {
  title: 'Dashboards/Widgets/Body',
  component: WidgetBody,
  decorators: [
    (Story) => (
      <WidgetFrame>
        <Story />
      </WidgetFrame>
    ),
  ],
  args: {
    widget: byType('tasks'),
    records,
    now: SEED_NOW,
    actions: { toggleTask: fn(), toggleHabitDay: fn(), updateNoteBody: fn() },
  },
};

export default meta;
type Story = StoryObj<typeof WidgetBody>;

export const TaskList: Story = {};

export const MissingRecord: Story = {
  args: { widget: byType('stat'), records: emptyRecords() },
};
