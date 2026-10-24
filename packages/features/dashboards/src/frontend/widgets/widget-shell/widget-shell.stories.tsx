import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { DEFAULT_SETTINGS } from '@synapcity/domain-dashboards';
import { expect, fn, userEvent, within } from 'storybook/test';

import { SEED_NOW, seededWorkspace } from '../../../testing';
import { WidgetBody } from '../widget-body';
import { WidgetShell } from './index';

const { composition, records } = seededWorkspace();
const widget = composition.widgets.find((w) => w.type === 'progress')!;
const bodyActions = {
  toggleTask: fn(),
  toggleHabitDay: fn(),
  updateNoteBody: fn(),
  updateMetricValue: fn(),
  updateGoal: fn(),
  addTask: fn(),
};

const meta: Meta<typeof WidgetShell> = {
  title: 'Dashboards/Widgets/Shell',
  component: WidgetShell,
  decorators: [
    (Story) => (
      <div className="h-48 w-80">
        <Story />
      </div>
    ),
  ],
  args: {
    widget,
    settings: DEFAULT_SETTINGS,
    editMode: false,
    actions: {
      update: fn(),
      duplicate: fn(),
      hide: fn(),
      archive: fn(),
      remove: fn(),
    },
    children: (
      <WidgetBody
        widget={widget}
        records={records}
        now={SEED_NOW}
        actions={bodyActions}
      />
    ),
  },
};

export default meta;
type Story = StoryObj<typeof WidgetShell>;

export const View: Story = {};

export const Edit: Story = {
  args: { editMode: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: `Collapse ${widget.title}` }),
    );
    await expect(args.actions.update).toHaveBeenCalledWith({ collapsed: true });
  },
};

export const Collapsed: Story = {
  args: { widget: { ...widget, collapsed: true } },
};

export const AccentHighlight: Story = {
  args: { widget: { ...widget, highlight: 'accent' } },
};

export const NeutralHighlight: Story = {
  args: { widget: { ...widget, highlight: 'neutral' } },
};

export const Untitled: Story = {
  args: { settings: { ...DEFAULT_SETTINGS, showWidgetTitles: false } },
};
