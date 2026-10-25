import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { AuthButtons } from './auth-buttons';

// No `nextjs.appDirectory`: the app-router mock in @storybook/nextjs-vite 10.6 does not
// provide the layout cache node that next 16.4's useRouter reads, so every story crashed.
const meta: Meta<typeof AuthButtons> = {
  title: 'Components/AuthButtons',
  component: AuthButtons,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AuthButtons>;

const destinations = { signInHref: '/sign-in', signUpHref: '/sign-up' };

export const Header: Story = {
  args: { ...destinations, variant: 'header' },
};
export const Hero: Story = { args: { ...destinations, variant: 'hero' } };
