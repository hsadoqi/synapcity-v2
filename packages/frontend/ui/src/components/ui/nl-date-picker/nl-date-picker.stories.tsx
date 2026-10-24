import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';

import { NLDatePicker } from '@synapcity/frontend-ui/core/nl-date-picker';

const meta: Meta<typeof NLDatePicker> = {
  title: 'Components/NLDatePicker',
  component: NLDatePicker,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof NLDatePicker>;

export const Default: Story = {};

export const ParsesNaturalLanguage: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText('Schedule Date');

    await userEvent.clear(input);
    await userEvent.type(input, 'December 25, 2026');

    await expect(input).toHaveValue('December 25, 2026');
    await expect(canvas.getByText('December 25, 2026')).toBeVisible();
  },
};
