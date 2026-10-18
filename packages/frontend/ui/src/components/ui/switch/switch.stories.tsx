import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';

import { Label } from '@synapcity/frontend-ui/core/label';
import { Switch } from '@synapcity/frontend-ui/core/switch';

const meta: Meta<typeof Switch> = {
  title: 'Components/Switch',
  component: Switch,
  tags: ['autodocs'],
  args: { 'aria-label': 'Notifications' },
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {};

export const Checked: Story = { args: { defaultChecked: true } };

export const Small: Story = { args: { size: 'sm', defaultChecked: true } };

export const Disabled: Story = { args: { disabled: true } };

export const DisabledChecked: Story = {
  args: { disabled: true, defaultChecked: true },
};

export const Invalid: Story = { args: { 'aria-invalid': true } };

export const WithLabel: Story = {
  args: { id: 'marketing', 'aria-label': undefined },
  render: (args) => (
    <div className="flex items-center gap-2">
      <Switch {...args} />
      <Label htmlFor="marketing">Marketing emails</Label>
    </div>
  ),
};

/** Clicking toggles the switch; the play function proves it end to end. */
export const Toggles: Story = {
  play: async ({ canvasElement }) => {
    const toggle = within(canvasElement).getByRole('switch', {
      name: 'Notifications',
    });

    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
  },
};
