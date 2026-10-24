import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { fn } from 'storybook/test';

import { seededWorkspace } from '../../../testing';
import { WidgetFrame } from '../../../testing';
import { NotesBody } from './index';

const note = Object.values(seededWorkspace().records.note).find(
  (n) => n.name === 'Ideas',
)!;

const meta: Meta<typeof NotesBody> = {
  title: 'Dashboards/Widgets/Notes',
  component: NotesBody,
  decorators: [
    (Story) => (
      <WidgetFrame>
        <Story />
      </WidgetFrame>
    ),
  ],
  args: { note, label: 'Ideas', onChange: fn() },
};

export default meta;
type Story = StoryObj<typeof NotesBody>;

export const Default: Story = {};

export const Blank: Story = { args: { note: { ...note, body: '' } } };
