import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { IconButton } from '@synapcity/frontend-ui/core/icon-button';
import { Home } from 'lucide-react';

const meta: Meta<typeof IconButton> = {
  title: 'Components/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  args: {
    children: <Home className="size-4" />,
  },
};

export default meta;
type Story = StoryObj<typeof IconButton>;

export const Default: Story = {
  args: {
    label: 'Home',
    onClick: () => alert('Icon button clicked!'),
  },
};

export const Disabled: Story = {
  args: {
    label: 'Home',
    disabled: true,
    onClick: () => alert('Icon button clicked!'),
    children: <Home className="size-4" />,
  },
};

export const SizeVariants: Story = {
  render: (args) => (
    <div className="flex gap-4">
      <IconButton {...args} size="xs" />
      <IconButton {...args} size="sm" />
      <IconButton {...args} size="md" />
      <IconButton {...args} size="lg" />
      <IconButton {...args} size="xl" />
    </div>
  ),
  args: {
    label: 'Home',
    onClick: () => alert('Icon button clicked!'),
    variant: 'ghost',
  },
};

export const Variants: Story = {
  render: (args) => (
    <div className="flex gap-4">
      <IconButton {...args} variant="default" />
      <IconButton {...args} variant="destructive" />
      <IconButton {...args} variant="outline" />
      <IconButton {...args} variant="secondary" />
      <IconButton {...args} variant="ghost" />
      <IconButton {...args} variant="link" />
    </div>
  ),
  args: {
    label: 'Home',
    onClick: () => alert('Icon button clicked!'),
    size: 'md',
  },
};
