import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ModeToggle } from '@synapcity/frontend-ui/components/mode-toggle';

const meta: Meta<typeof ModeToggle> = {
  title: 'Components/ModeToggle',
  component: ModeToggle,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ModeToggle>;

export const Default: Story = {
  args: {},
};

export const SizeVariants: Story = {
  render: (args) => (
    <div className="flex gap-4">
      <ModeToggle {...args} size="xs" />
      <ModeToggle {...args} size="sm" />
      <ModeToggle {...args} size="md" />
      <ModeToggle {...args} size="lg" />
      <ModeToggle {...args} size="xl" />
    </div>
  ),
  args: {},
};

export const Variants: Story = {
  render: (args) => (
    <div className="flex gap-4">
      <ModeToggle {...args} variant="default" />
      <ModeToggle {...args} variant="destructive" />
      <ModeToggle {...args} variant="outline" />
      <ModeToggle {...args} variant="secondary" />
      <ModeToggle {...args} variant="ghost" />
      <ModeToggle {...args} variant="link" />
    </div>
  ),
  args: {},
};
