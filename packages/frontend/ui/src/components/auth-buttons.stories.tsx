import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { AuthButtons } from './auth-buttons';

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

export const Header: Story = { args: { variant: 'header' } };
export const Hero: Story = { args: { variant: 'hero' } };
