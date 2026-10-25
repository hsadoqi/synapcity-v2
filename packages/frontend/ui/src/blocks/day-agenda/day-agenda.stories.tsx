import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CalendarPlus, Pin } from 'lucide-react';
import { useState } from 'react';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';
import { DayAgenda, type DayAgendaWithDialog } from './day-agenda';
import type { TimeSlot } from './day-agenda.types';

const startTime = new Date();
startTime.setHours(9, 0, 0, 0);
const timeLabel = startTime.toLocaleTimeString([], {
  hour: '2-digit',
  minute: '2-digit',
});
const sampleTimeSlots: TimeSlot[] = [
  { start: timeLabel, label: 'API refactor', tone: 'focus' },
  { start: timeLabel, label: 'Standup', tone: 'meeting' },
  { start: timeLabel, label: 'Lunch', tone: 'break' },
  { start: timeLabel, label: 'Email & admin', tone: 'admin' },
];

const sampleDayAgendaProps: DayAgendaWithDialog = {
  date: '2026-10-24',
  slots: sampleTimeSlots,
  surface: 'card',
  bordered: false,
  inverted: false,
};

const meta: Meta<typeof DayAgenda> = {
  title: 'Blocks/Day Agenda',
  component: DayAgenda,
  args: sampleDayAgendaProps,
  argTypes: {
    surface: {
      control: { type: 'select' },
      options: ['card', 'glass'],
    },
    bordered: {
      control: { type: 'boolean' },
    },
    inverted: {
      control: { type: 'boolean' },
    },
    modal: {
      control: { type: 'boolean' },
    },
    dialogContainer: {
      control: { type: 'select' },
      options: ['card', 'window', 'body', 'inline'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof DayAgenda>;

export const Default: Story = {
  args: {},
};

export const Surfaces: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      <DayAgenda {...args} surface="card" />
      <DayAgenda {...args} surface="glass" />
    </div>
  ),
};

export const Bordered: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      <DayAgenda {...args} />
      <DayAgenda {...args} bordered />
    </div>
  ),
};

export const Inverted: Story = {
  args: {
    modal: true,
  },

  render: (args) => (
    <div className="flex items-center gap-4">
      <DayAgenda {...args} />
      <DayAgenda {...args} inverted />
    </div>
  ),
};

export const SettingsScroll: Story = {
  // Wide enough (32rem) for settings to open as a dialog in `'auto'`,
  // whatever the test browser's window size.
  decorators: [
    (Story) => (
      <div className="w-lg">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Agenda settings' }),
    );
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => {
      const viewport = dialog.querySelector(
        '[data-slot="scroll-area-viewport"]',
      );
      expect(viewport).not.toBeNull();
      // Content taller than the viewport, and the dialog stays inside the window.
      expect(viewport!.scrollHeight).toBeGreaterThan(viewport!.clientHeight);
      expect(dialog.getBoundingClientRect().height).toBeLessThanOrEqual(
        window.innerHeight,
      );
    });
  },
};

export const SettingsScopedToAgenda: Story = {
  args: { inverted: true },
  render: (args) => (
    <div data-testid="host" className="w-lg">
      <DayAgenda {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Agenda settings' }),
    );
    const dialog = await screen.findByRole('dialog');
    // Inside the agenda (and so its inverted theme), not appended to body.
    expect(canvasElement.contains(dialog)).toBe(true);
  },
};

/** The settings dialog on each placement, over each surface. */
export const DialogPlacements: Story = {
  render: (args) => (
    <div className="grid grid-cols-2 gap-4">
      <DayAgenda {...args} dialogContainer="card" />
      <DayAgenda {...args} surface="glass" dialogContainer="card" />
      <DayAgenda {...args} dialogContainer="window" />
      <DayAgenda {...args} surface="glass" dialogContainer="window" />
    </div>
  ),
};

/** A custom trigger, title and body through `settings`. */
export const CustomSettings: Story = {
  // Wide enough (32rem) for settings to open as a dialog in `'auto'`,
  // whatever the test browser's window size.
  decorators: [
    (Story) => (
      <div className="w-lg">
        <Story />
      </div>
    ),
  ],
  args: {
    settings: {
      title: 'Agenda preferences',
      description: 'Choose how your day is shown.',
      trigger: (
        <button type="button" className="text-xs underline">
          Edit
        </button>
      ),
      content: <p className="text-sm">Week starts on Monday.</p>,
    },
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Edit' }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Agenda preferences',
    });
    expect(dialog.textContent).toContain('Week starts on Monday.');
  },
};

/** With `onDateChange`, the date gets previous and next buttons and opens a calendar. */
export const DateNavigation: Story = {
  render: function Render(args) {
    const [date, setDate] = useState('2026-10-24');
    return <DayAgenda {...args} date={date} onDateChange={setDate} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Next day' }));
    await expect(
      canvas.getByRole('button', { name: /choose a date/i }),
    ).toHaveTextContent('Sun, Oct 25');
  },
};

const manySlots: TimeSlot[] = Array.from({ length: 12 }, (_, index) => ({
  id: `slot-${index}`,
  start: `${String(8 + index).padStart(2, '0')}:00`,
  label: `Slot ${index + 1}`,
  tone: (['focus', 'meeting', 'break', 'admin'] as const)[index % 4]!,
}));

/** Twelve slots in a fixed-height cell scroll inside the card. */
export const ManySlots: Story = {
  args: { slots: manySlots },
  render: (args) => (
    <div className="h-80 w-96">
      <DayAgenda {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const viewport = canvasElement.querySelector(
      '[data-slot="scroll-area-viewport"]',
    );
    await waitFor(() => {
      expect(viewport).not.toBeNull();
      expect(viewport!.scrollHeight).toBeGreaterThan(viewport!.clientHeight);
    });
  },
};

export const CustomMenuItems: Story = {
  args: {
    menuItems: [{ label: 'Add event' }, { label: 'Import calendar' }],
  },
};

/** The same toolbar in a wide and a narrow card: it follows the card, not the window. */
export const ResponsiveToolbar: Story = {
  args: {
    menuItems: [
      { label: 'Add event', icon: <CalendarPlus /> },
      { label: 'Pin', icon: <Pin /> },
      { label: 'Help' },
    ],
  },
  render: (args) => (
    <div className="flex flex-col gap-4">
      <div className="w-lg">
        <DayAgenda {...args} />
      </div>
      <div className="w-2xs">
        <DayAgenda {...args} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const pins = within(canvasElement).getAllByRole('button', { name: 'Pin' });
    // Only the wide card shows Pin as a button; the narrow one folds it away.
    await expect(pins).toHaveLength(1);
  },
};

/** Settings open in place in a narrow card and as a dialog in a wide one. */
export const SettingsByWidth: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      <div data-testid="narrow" className="h-80 w-2xs">
        <DayAgenda {...args} />
      </div>
      <div data-testid="wide" className="w-lg">
        <DayAgenda {...args} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const narrow = within(canvas.getByTestId('narrow'));
    await userEvent.click(
      narrow.getByRole('button', { name: 'Agenda settings' }),
    );
    // Narrow: the card's content becomes the settings view, no dialog.
    await expect(
      narrow.getByRole('region', { name: 'Settings' }),
    ).toBeVisible();
    await expect(screen.queryByRole('dialog')).toBeNull();
    await userEvent.click(narrow.getByRole('button', { name: 'Done' }));
    await expect(narrow.getByText('API refactor')).toBeVisible();

    // Wide: the same trigger opens the dialog.
    const wide = within(canvas.getByTestId('wide'));
    await userEvent.click(
      wide.getByRole('button', { name: 'Agenda settings' }),
    );
    await expect(await screen.findByRole('dialog')).toBeDefined();
  },
};

/** Inside a host that draws its own frame: no card, no toolbar, just the content. */
export const InHost: Story = {
  args: { frame: false, toolbar: false },
  render: (args) => (
    <section
      aria-label="Host panel"
      className="flex h-80 w-sm flex-col rounded-lg border border-border bg-card p-3 text-card-foreground"
    >
      <DayAgenda {...args} />
    </section>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.queryByRole('button', { name: 'Agenda settings' }),
    ).toBeNull();
    await expect(canvas.getByText('API refactor')).toBeVisible();
  },
};
