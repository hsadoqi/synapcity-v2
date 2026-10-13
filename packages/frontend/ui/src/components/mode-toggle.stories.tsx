import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  ModeToggle,
  ModeButton,
  ModeMenu,
} from '@synapcity/frontend-ui/components/mode-toggle';
import { DropdownMenu } from './ui/dropdown-menu';

const meta: Meta<typeof ModeToggle> = {
  title: 'Components/ModeToggle',
  subcomponents: { ModeButton, ModeMenu },
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

export const Button: StoryObj<typeof ModeButton> = {
  decorators: [
    (Story) => (
      <div className="flex gap-4">
        <DropdownMenu>
          <Story />
        </DropdownMenu>
      </div>
    ),
  ],
  render: (args) => (
    <div className="flex gap-4">
      <ModeButton {...args} size="xs" />
      <ModeButton {...args} size="sm" />
      <ModeButton {...args} size="md" />
      <ModeButton {...args} size="lg" />
      <ModeButton {...args} size="xl" />
    </div>
  ),
  args: {},
};

export const Menu: StoryObj<typeof ModeMenu> = {
  decorators: [
    (Story) => (
      <div className="flex gap-4">
        <DropdownMenu>
          <Story />
        </DropdownMenu>
      </div>
    ),
  ],
  render: (args) => (
    <div className="flex gap-4">
      <ModeMenu {...args} aria-label="Light mode" value="light" />
      <ModeMenu {...args} aria-label="Dark mode" value="dark" />
      <ModeMenu {...args} aria-label="System mode" value="system" />
    </div>
  ),
  args: {},
};
