import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';

import {
  DatePicker,
  DateRangePicker,
} from '@synapcity/frontend-ui/core/date-picker';
import { Field, FieldLabel } from '@synapcity/frontend-ui/core/field';

const may4 = new Date(2026, 4, 4);

const meta: Meta<typeof DatePicker> = {
  title: 'Components/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
  args: {
    id: 'story-date',
    placeholder: 'Pick a due date',
  },
  decorators: [
    (Story) => (
      <div className="mx-auto w-72 p-6">
        <Field>
          <FieldLabel htmlFor="story-date">Due date</FieldLabel>
          <Story />
        </Field>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DatePicker>;

export const Default: Story = {};

export const WithValue: Story = {
  args: { defaultValue: may4 },
};

export const Constrained: Story = {
  args: {
    defaultValue: may4,
    min: new Date(2026, 4, 1),
    max: new Date(2026, 4, 15),
  },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Invalid: Story = {
  args: { 'aria-invalid': true, 'aria-describedby': 'date-error' },
  render: (args) => (
    <>
      <DatePicker {...args} />
      <p id="date-error" className="text-sm text-destructive">
        Choose a due date.
      </p>
    </>
  ),
};

export const Range: Story = {
  render: () => (
    <DateRangePicker
      id="story-date"
      defaultValue={{ from: may4, to: new Date(2026, 4, 9) }}
      numberOfMonths={2}
    />
  ),
};

export const SelectsADate: Story = {
  args: { defaultValue: may4, onValueChange: fn() },
  play: async ({ canvasElement, args }) => {
    const trigger = within(canvasElement).getByRole('button', {
      name: 'Due date',
    });
    await userEvent.click(trigger);
    await userEvent.click(
      await screen.findByRole('button', { name: /Monday, May 11th, 2026/ }),
    );

    await expect(args.onValueChange).toHaveBeenLastCalledWith(
      new Date(2026, 4, 11),
    );
    await expect(trigger).toHaveTextContent('May 11, 2026');
    await waitFor(() => expect(screen.queryByRole('grid')).toBeNull());
  },
};
