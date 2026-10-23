import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { BoldIcon } from 'lucide-react';

import { Toggle } from '@synapcity/frontend-ui/components/ui/toggle';

const meta: Meta<typeof Toggle> = {
  title: 'Components/Toggle',
  component: Toggle,
  tags: ['autodocs'],
  args: { 'aria-label': 'Toggle bold' },
  render: (args) => (
    <Toggle {...args}>
      <BoldIcon aria-hidden />
    </Toggle>
  ),
};

export default meta;
type Story = StoryObj<typeof Toggle>;

export const Default: Story = {};

export const Pressed: Story = { args: { defaultPressed: true } };

export const Outline: Story = { args: { variant: 'outline' } };

export const Destructive: Story = { args: { variant: 'destructive' } };

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-2">
      {(['sm', 'default', 'lg'] as const).map((size) => (
        <Toggle key={size} {...args} size={size} aria-label={`Bold ${size}`}>
          <BoldIcon aria-hidden />
        </Toggle>
      ))}
    </div>
  ),
};

export const Disabled: Story = { args: { disabled: true } };
