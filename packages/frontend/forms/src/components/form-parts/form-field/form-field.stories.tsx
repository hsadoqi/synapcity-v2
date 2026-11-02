import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { FormField } from './form-field';

const meta: Meta<typeof FormField> = {
  title: 'Forms/FormField',
  component: FormField,
  tags: ['autodocs'],
  args: { id: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
};

export default meta;
type Story = StoryObj<typeof FormField>;

export const Default: Story = {};

/** The rule is read out with the field until the field is invalid. */
export const WithHint: Story = {
  args: {
    id: 'name',
    label: 'Name',
    type: 'text',
    hint: 'Use at least 3 characters.',
  },
};

/** The message carries the rule while the field is invalid, so the hint steps aside. */
export const Invalid: Story = {
  args: {
    hint: 'Use at least 3 characters.',
    invalid: true,
    messageId: 'story-message',
  },
  render: (args) => (
    <div className="flex flex-col gap-2">
      <FormField {...args} />
      <p id="story-message" role="alert" className="text-sm text-destructive">
        Enter your email.
      </p>
    </div>
  ),
};

export const Password: Story = {
  args: {
    id: 'password',
    label: 'Password',
    type: 'password',
    autoComplete: 'current-password',
  },
};
