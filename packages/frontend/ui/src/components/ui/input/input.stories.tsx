import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Input } from '@synapcity/frontend-ui/core/input';
import { Label } from '@synapcity/frontend-ui/core/label';

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
  args: { id: 'input-story', placeholder: 'you@example.com' },
  decorators: [
    (Story) => (
      <div className="flex w-80 flex-col gap-2">
        <Label htmlFor="input-story">Email</Label>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Empty: Story = { args: { type: 'email' } };

export const Filled: Story = { args: { defaultValue: 'hanaa@example.com' } };

export const Disabled: Story = { args: { disabled: true } };

export const Invalid: Story = {
  args: { 'aria-invalid': true, defaultValue: 'not-an-email' },
};

export const Password: Story = { args: { type: 'password', placeholder: '' } };
