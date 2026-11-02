import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { FormMessage } from './form-message';

const meta: Meta<typeof FormMessage> = {
  title: 'Forms/FormMessage',
  component: FormMessage,
  tags: ['autodocs'],
  args: { id: 'form-message' },
};

export default meta;
type Story = StoryObj<typeof FormMessage>;

export const WithError: Story = {
  args: { state: { error: 'Enter your email.' } },
};

export const Status: Story = {
  args: { state: { message: 'If that account exists, we sent a link.' } },
};

export const Empty: Story = { args: { state: {} } };
