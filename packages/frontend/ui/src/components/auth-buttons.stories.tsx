import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { AuthButtons } from '@synapcity/frontend-ui/components/auth-buttons';

const meta: Meta<typeof AuthButtons> = {
  title: 'Components/AuthButtons',
  component: AuthButtons,
  tags: ['autodocs'],
  parameters: {
    nextjs: {
      appDirectory: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof AuthButtons>;

const destinations = { signInHref: '/sign-in', signUpHref: '/sign-up' };

export const Header: Story = {
  args: { ...destinations, variant: 'header' },
};
export const Hero: Story = { args: { ...destinations, variant: 'hero' } };
