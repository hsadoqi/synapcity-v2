import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { useState } from 'react';
import { z } from 'zod';

import { FormField } from '../../components/form-field';
import { FormMessage } from '../../components/form-message';
import { fieldErrorProps } from '../../utils/form-feedback';
import { useFocusFirstError } from '../use-focus-first-error';
import { useActionForm } from './use-action-form';

const schema = z.object({
  email: z.string().trim().min(1, 'Enter your email.'),
});

/** A form shaped like the forgot-password pilot, with a stand-in for the server action. */
function ActionForm() {
  const [sent, setSent] = useState<string>();
  const { formProps, register, state } = useActionForm({
    schema,
    action: (formData) => setSent(String(formData.get('email'))),
    state: {},
  });
  const formRef = useFocusFirstError(state);
  return (
    <form
      ref={formRef}
      {...formProps}
      aria-label="Reset your password"
      className="flex flex-col gap-4"
    >
      <FormField
        id="email"
        {...fieldErrorProps(state, 'email', 'email-message')}
        label="Email"
        type="email"
        autoComplete="email"
        required
        {...register('email')}
      />
      <FormMessage
        id="email-message"
        state={sent ? { message: `Sent to ${sent}.` } : state}
      />
      <button type="submit">Send reset link</button>
    </form>
  );
}

const meta: Meta<typeof ActionForm> = {
  title: 'Forms/useActionForm',
  component: ActionForm,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ActionForm>;

export const Idle: Story = {};

/** An empty submit is refused in the browser: the message, the marking and the focus match a server refusal. */
export const RefusesAnEmptyEmail: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Send reset link' }),
    );
    const email = canvas.getByLabelText('Email');
    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      'Enter your email.',
    );
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await expect(email).toHaveFocus();
  },
};

export const SendsAValidEmail: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('Email'), 'ada@example.com');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Send reset link' }),
    );
    await expect(await canvas.findByRole('status')).toHaveTextContent(
      'Sent to ada@example.com.',
    );
  },
};

const avatarSchema = z.object({
  avatar: z
    .instanceof(File)
    .refine((file) => file.size > 0, 'Choose an image.'),
});

/** A file input, checked in a real browser: jsdom cannot set a chosen file. */
function AvatarForm() {
  const [sent, setSent] = useState<string>();
  const { formProps, state } = useActionForm({
    schema: avatarSchema,
    action: (formData) => {
      const file = formData.get('avatar');
      setSent(file instanceof File ? file.name : '');
    },
    state: {},
  });
  return (
    <form
      {...formProps}
      aria-label="Change your avatar"
      className="flex flex-col gap-4"
    >
      <label htmlFor="avatar">Avatar</label>
      <input id="avatar" name="avatar" type="file" />
      <FormMessage
        id="avatar-message"
        state={sent ? { message: `Uploaded ${sent}.` } : state}
      />
      <button type="submit">Upload</button>
    </form>
  );
}

export const ValidatesAFileInput: Story = {
  render: () => <AvatarForm />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Upload' }));
    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      'Choose an image.',
    );
    const file = new File(['x'], 'me.png', { type: 'image/png' });
    await userEvent.upload(canvas.getByLabelText('Avatar'), file);
    await userEvent.click(canvas.getByRole('button', { name: 'Upload' }));
    await expect(await canvas.findByRole('status')).toHaveTextContent(
      'Uploaded me.png.',
    );
  },
};
