import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  expect,
  fireEvent,
  screen,
  userEvent,
  waitFor,
  within,
} from 'storybook/test';

import { TimePicker } from '@synapcity/frontend-ui/core/time-picker';

const meta: Meta<typeof TimePicker> = {
  title: 'Components/TimePicker',
  component: TimePicker,
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
type Story = StoryObj<typeof TimePicker>;

export const Default: Story = {};

export const SelectsADateAndTime: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Date' });
    const time = canvas.getByLabelText('Time');

    fireEvent.change(time, { target: { value: '14:45:30' } });
    await expect(time).toHaveValue('14:45:30');

    await userEvent.click(trigger);
    const grid = await screen.findByRole('grid');
    const day = within(grid)
      .getAllByRole('button')
      .find((button) => !button.hasAttribute('disabled'));
    await expect(day).toBeTruthy();
    await userEvent.click(day!);

    await expect(trigger).not.toHaveTextContent('Select date');
    await waitFor(() => expect(screen.queryByRole('grid')).toBeNull());
  },
};
