import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { Calendar } from '@synapcity/frontend-ui/core/calendar';

const may4 = new Date(2026, 4, 4);
const may9 = new Date(2026, 4, 9);
const onSelect = fn();

const meta: Meta<typeof Calendar> = {
  title: 'Components/Calendar',
  component: Calendar,
  tags: ['autodocs'],
  args: { defaultMonth: may4 },
  decorators: [
    (Story) => (
      <div className="flex min-h-80 items-start justify-center p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Calendar>;

export const Default: Story = {};

export const Selected: Story = {
  args: { mode: 'single', selected: may4 },
};

export const Range: Story = {
  args: {
    mode: 'range',
    selected: { from: may4, to: may9 },
  },
};

export const DropdownNavigation: Story = {
  args: {
    captionLayout: 'dropdown',
    startMonth: new Date(2020, 0, 1),
    endMonth: new Date(2030, 11, 1),
  },
};

export const MultipleMonths: Story = {
  args: { numberOfMonths: 2 },
};

export const SelectsADay: Story = {
  args: { mode: 'single', onSelect },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', {
        name: /Monday, May 4th, 2026/,
      }),
    );

    await expect(onSelect).toHaveBeenCalledWith(
      may4,
      may4,
      expect.any(Object),
      expect.any(Object),
    );
  },
};
