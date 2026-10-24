import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { LinkButton } from '@synapcity/frontend-ui/next/link-button';

const meta: Meta<typeof LinkButton> = {
  title: 'Components/LinkButton',
  component: LinkButton,
  tags: ['autodocs'],
  args: {
    href: '#',
    children: 'Link Button',
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: [
        'default',
        'destructive',
        'outline',
        'secondary',
        'ghost',
        'link',
      ],
    },
    size: {
      control: { type: 'select' },
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof LinkButton>;

export const Default: Story = {
  args: {
    href: '#',
    children: 'Link Button',
  },
};

export const Disabled: Story = {
  args: {
    href: '#',
    children: 'Link Button',
  },
};

export const Variants: Story = {
  render: (args) => (
    <div className="flex gap-4">
      <LinkButton {...args} variant="default" />
      <LinkButton {...args} variant="destructive" />
      <LinkButton {...args} variant="outline" />
      <LinkButton {...args} variant="secondary" />
      <LinkButton {...args} variant="ghost" />
      <LinkButton {...args} variant="link" />
    </div>
  ),
  args: {
    href: '#',
    children: 'Link Button',
  },
};
