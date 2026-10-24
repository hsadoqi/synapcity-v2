import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';

import { Checkbox } from '@synapcity/frontend-ui/core/checkbox';
import { Label } from '@synapcity/frontend-ui/core/label';

const meta: Meta<typeof Checkbox> = {
  title: 'Components/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  args: { 'aria-label': 'Done' },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {};

export const Checked: Story = { args: { defaultChecked: true } };

export const Disabled: Story = { args: { disabled: true } };

export const DisabledChecked: Story = {
  args: { disabled: true, defaultChecked: true },
};

export const WithLabel: Story = {
  args: { id: 'outline', 'aria-label': undefined },
  render: (args) => (
    <div className="flex items-center gap-2">
      <Checkbox {...args} />
      <Label htmlFor="outline">Sketch onboarding flow</Label>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByRole('checkbox', {
      name: 'Sketch onboarding flow',
    });
    await userEvent.click(box);
    await expect(box).toHaveAttribute('aria-checked', 'true');
  },
};
