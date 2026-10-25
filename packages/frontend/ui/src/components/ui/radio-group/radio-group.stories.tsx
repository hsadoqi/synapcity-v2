import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { Label } from '@synapcity/frontend-ui/core/label';
import {
  RadioGroup,
  RadioGroupItem,
} from '@synapcity/frontend-ui/core/radio-group';

const options = [
  ['daily', 'Daily'],
  ['weekly', 'Weekly'],
  ['monthly', 'Monthly'],
] as const;

const meta: Meta<typeof RadioGroup> = {
  title: 'Components/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
  args: {
    'aria-label': 'Notification frequency',
    defaultValue: 'weekly',
  },
  render: (args) => (
    <RadioGroup {...args} className="max-w-64">
      {options.map(([value, label]) => (
        <div key={value} className="flex items-center gap-2">
          <RadioGroupItem id={`frequency-${value}`} value={value} />
          <Label htmlFor={`frequency-${value}`}>{label}</Label>
        </div>
      ))}
    </RadioGroup>
  ),
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Invalid: Story = {
  render: (args) => (
    <RadioGroup {...args} aria-describedby="frequency-error">
      <div className="flex items-center gap-2">
        <RadioGroupItem id="frequency-required" value="required" aria-invalid />
        <Label htmlFor="frequency-required">Required choice</Label>
      </div>
      <p id="frequency-error" className="text-sm text-destructive">
        Choose a frequency.
      </p>
    </RadioGroup>
  ),
};

export const SelectsAnOption: Story = {
  args: { onValueChange: fn() },
  play: async ({ canvasElement, args }) => {
    const daily = within(canvasElement).getByRole('radio', { name: 'Daily' });

    await userEvent.click(daily);

    await expect(args.onValueChange).toHaveBeenLastCalledWith(
      'daily',
      expect.any(Object),
    );
    await expect(daily).toHaveAttribute('aria-checked', 'true');
  },
};
