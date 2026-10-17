import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Input } from '@synapcity/frontend-ui/core/input';
import { Label } from '@synapcity/frontend-ui/core/label';

const meta: Meta<typeof Label> = {
  title: 'Components/Label',
  component: Label,
  tags: ['autodocs'],
  args: { children: 'Display name' },
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {};

export const WithInput: Story = {
  render: (args) => (
    <div className="flex w-80 flex-col gap-2">
      <Label {...args} htmlFor="label-story" />
      <Input id="label-story" placeholder="Hanaa" />
    </div>
  ),
};
