import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PlusIcon } from 'lucide-react';

import { Button } from '@synapcity/frontend-ui/core/button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  args: { children: 'Save' },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-2">
      <Button {...args} variant="default">
        Default
      </Button>
      <Button {...args} variant="outline">
        Outline
      </Button>
      <Button {...args} variant="secondary">
        Secondary
      </Button>
      <Button {...args} variant="selected">
        Selected
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
      <Button {...args} variant="destructive">
        Destructive
      </Button>
      <Button {...args} variant="link">
        Link
      </Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-2">
      <Button {...args} size="xs">
        Extra small
      </Button>
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="default">
        Default
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
    </div>
  ),
};

/** Icon-only buttons carry no text, so `label` supplies the accessible name. */
export const IconOnly: Story = {
  args: { label: 'Add item', size: 'icon', variant: 'outline' },
  render: (args) => (
    <Button {...args}>
      <PlusIcon aria-hidden />
    </Button>
  ),
};

export const Disabled: Story = { args: { disabled: true } };

/** `toggle` makes the button report pressed state with `aria-pressed`. */
export const Toggle: Story = {
  args: { toggle: true, variant: 'outline', children: 'Pin' },
};

export const TogglePressed: Story = {
  args: {
    toggle: true,
    defaultPressed: true,
    variant: 'outline',
    children: 'Pin',
  },
};
