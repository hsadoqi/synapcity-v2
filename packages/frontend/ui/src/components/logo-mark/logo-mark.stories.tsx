import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SynapcityLogo } from '@synapcity/frontend-ui/components/logo-mark';

const meta: Meta<typeof SynapcityLogo> = {
  title: 'Components/LogoMark',
  component: SynapcityLogo,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof SynapcityLogo>;

export const Default: Story = {
  args: {},
};
