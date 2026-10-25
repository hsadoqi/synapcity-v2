import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { useActionState } from 'react';
import { Button } from '@synapcity/frontend-ui/core/button';
import { Label } from '@synapcity/frontend-ui/core/label';
import { Input } from '@synapcity/frontend-ui/core/input';
import { z } from 'zod';

import { FormField } from '../../components/form-field';
import { FormMessage } from '../../components/form-message';
import { fieldErrorProps } from '../../utils/form-feedback';
import { useFocusFirstError } from '../use-focus-first-error';
import { useActionForm, type FormFeedback } from './use-action-form';

type Result = FormFeedback & { readonly message?: string };

const schema = z.object({
  email: z.string().trim().min(1, 'Enter your email.'),
});

/** A form shaped like the forgot-password pilot, with a stand-in for the server action. */
function ActionForm() {
  const [result, action] = useActionState<Result, FormData>(
    async (_previous, formData) => ({
      message: `Sent to ${String(formData.get('email'))}.`,
    }),
    {},
  );
  const { formProps, register, state } = useActionForm({
    schema,
    action,
    state: result,
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
      <FormMessage id="email-message" state={state} />
      <Button type="submit">Send reset link</Button>
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
  const [result, action] = useActionState<Result, FormData>(
    async (_previous, formData) => {
      const file = formData.get('avatar');
      return { message: `Uploaded ${file instanceof File ? file.name : ''}.` };
    },
    {},
  );
  const { formProps, state } = useActionForm({
    schema: avatarSchema,
    action,
    state: result,
  });
  return (
    <form
      {...formProps}
      aria-label="Change your avatar"
      className="flex flex-col gap-4"
    >
      <Label htmlFor="avatar">Avatar</Label>
      <Input id="avatar" name="avatar" type="file" />
      <FormMessage id="avatar-message" state={state} />
      <Button type="submit">Upload</Button>
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
    // `userEvent.upload` overrides the input's `files` property but not the
    // file list the browser submits, which is what `FormData` reads. A
    // `DataTransfer` sets the real list, as choosing a file does.
    const input = canvas.getByLabelText<HTMLInputElement>('Avatar');
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await userEvent.click(canvas.getByRole('button', { name: 'Upload' }));
    await expect(await canvas.findByRole('status')).toHaveTextContent(
      'Uploaded me.png.',
    );
  },
};
