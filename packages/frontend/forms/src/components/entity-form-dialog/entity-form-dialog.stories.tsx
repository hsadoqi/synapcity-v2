import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { z } from 'zod';

import { Button } from '@synapcity/frontend-ui/core/button';

import { defineForm } from '../../utils';
import { EntityFormDialog } from './index';

const definition = defineForm({
  schema: z.object({
    name: z.string().min(1, 'Enter a name.'),
    notes: z.string().optional(),
  }),
  fields: [
    { type: 'text', name: 'name', label: 'Name' },
    { type: 'textarea', name: 'notes', label: 'Notes' },
  ],
});

const meta: Meta<typeof EntityFormDialog> = {
  title: 'Forms/EntityFormDialog',
  component: EntityFormDialog,
  parameters: { layout: 'centered' },
  args: {
    mode: 'create',
    entityName: 'event',
    trigger: <Button variant="outline">Open</Button>,
    definition,
    onSubmit: fn(),
  },
  argTypes: {
    mode: { control: 'select', options: ['create', 'edit'] },
    presentation: { control: 'select', options: ['dialog', 'sheet', 'inline'] },
    trigger: { control: false },
    definition: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof EntityFormDialog>;

const open = async (canvasElement: HTMLElement) => {
  await userEvent.click(
    within(canvasElement).getByRole('button', { name: 'Open' }),
  );
  return screen.findByRole('dialog');
};

export const Create: Story = {
  play: async ({ canvasElement, args }) => {
    const dialog = await open(canvasElement);
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Create' }),
    );
    // The form refuses an empty name and the dialog stays.
    await expect(
      await within(dialog).findByText('Enter a name.'),
    ).toBeVisible();
    await userEvent.type(within(dialog).getByLabelText('Name'), 'Standup');
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Create' }),
    );
    await waitFor(() => expect(args.onSubmit).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};

export const EditWithDelete: Story = {
  args: {
    mode: 'edit',
    entityLabel: 'Standup',
    initialValues: { name: 'Standup', notes: 'Daily at nine' },
    onDelete: fn(),
  },
  play: async ({ canvasElement }) => {
    const dialog = await open(canvasElement);
    await expect(within(dialog).getByLabelText('Name')).toHaveValue('Standup');
    await expect(
      within(dialog).getByRole('button', { name: 'Delete' }),
    ).toBeInTheDocument();
  },
};

export const InSheet: Story = {
  args: {
    presentation: 'sheet',
    mode: 'edit',
    initialValues: { name: 'Standup' },
  },
};
