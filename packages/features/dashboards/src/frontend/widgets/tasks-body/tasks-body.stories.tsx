import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { tasksForProject } from '@synapcity/domain-prototypes';
import { fn } from 'storybook/test';

import { seededWorkspace } from '../../../testing/seed';
import { WidgetFrame } from '../../../testing/widget-frame';
import { TasksBody } from './index';

const { records } = seededWorkspace();
const project = Object.values(records.project)[0]!;

const meta: Meta<typeof TasksBody> = {
  title: 'Dashboards/Widgets/Tasks',
  component: TasksBody,
  decorators: [
    (Story) => (
      <WidgetFrame>
        <Story />
      </WidgetFrame>
    ),
  ],
  args: {
    project,
    tasks: tasksForProject(records.task, project.id),
    onToggleTask: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof TasksBody>;

export const Default: Story = {};

export const Empty: Story = { args: { tasks: [] } };
