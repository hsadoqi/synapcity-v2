import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { TrashIcon } from 'lucide-react';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';

import { Button } from '@synapcity/frontend-ui/core/button';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@synapcity/frontend-ui/core/alert-dialog';

const meta: Meta<typeof AlertDialog> = {
  title: 'Components/AlertDialog',
  component: AlertDialog,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof AlertDialog>;

const Example = ({
  defaultOpen,
  size,
  withMedia,
}: {
  defaultOpen?: boolean;
  size?: 'default' | 'sm';
  withMedia?: boolean;
}) => (
  <AlertDialog defaultOpen={defaultOpen}>
    <AlertDialogTrigger render={<Button variant="outline" />}>
      Delete note
    </AlertDialogTrigger>
    <AlertDialogContent size={size}>
      <AlertDialogHeader>
        {withMedia ? (
          <AlertDialogMedia>
            <TrashIcon aria-hidden />
          </AlertDialogMedia>
        ) : null}
        <AlertDialogTitle>Delete this note?</AlertDialogTitle>
        <AlertDialogDescription>
          This permanently removes the note and its history.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction variant="destructive">Delete</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export const Closed: Story = { render: () => <Example /> };

export const Open: Story = { render: () => <Example defaultOpen /> };

export const Small: Story = {
  render: () => <Example defaultOpen size="sm" />,
};

export const WithMedia: Story = {
  render: () => <Example defaultOpen withMedia />,
};

/** The trigger opens a named alertdialog, and Cancel closes it again. */
export const OpensAndCancels: Story = {
  render: () => <Example />,
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Delete note' }),
    );

    const dialog = await screen.findByRole('alertdialog', {
      name: 'Delete this note?',
    });
    // Visible once the enter animation has finished fading it in.
    await waitFor(() => expect(dialog).toBeVisible());

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Cancel' }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
  },
};
