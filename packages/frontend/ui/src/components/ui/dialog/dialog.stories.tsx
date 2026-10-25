import { type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';

import { Button } from '@synapcity/frontend-ui/core/button';
import { Input } from '@synapcity/frontend-ui/core/input';
import { Label } from '@synapcity/frontend-ui/core/label';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@synapcity/frontend-ui/core/dialog';

const meta = {
  title: 'Components/Dialog',
  component: Dialog,
  subcomponents: {
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
  },
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { onOpenChange: fn() },
  argTypes: {
    defaultOpen: { control: 'boolean' },
    modal: { control: 'select', options: [true, false, 'trap-focus'] },
    disablePointerDismissal: { control: 'boolean' },
    open: {
      control: false,
      description: 'Controlled by the owner; see the Controlled story.',
    },
    children: { control: false },
  },
  render: (args) => <Example {...args} />,
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function Example({
  showCloseButton = true,
  footerClose = false,
  disabled = false,
  ...props
}: ComponentProps<typeof Dialog> & {
  showCloseButton?: boolean;
  footerClose?: boolean;
  disabled?: boolean;
}) {
  return (
    <Dialog {...props}>
      <DialogTrigger disabled={disabled} render={<Button variant="outline" />}>
        Open dialog
      </DialogTrigger>
      <DialogContent showCloseButton={showCloseButton}>
        <DialogHeader>
          <DialogTitle>Document details</DialogTitle>
          <DialogDescription>
            Review the document details before continuing.
          </DialogDescription>
        </DialogHeader>
        <p>This example only changes local dialog state.</p>
        <DialogFooter showCloseButton={footerClose}>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

async function waitForDialog(name = 'Document details') {
  const dialog = await screen.findByRole('dialog', { name });
  await waitFor(() => expect(dialog).toBeVisible());
  // Wait for the real popup/backdrop animations before the automatic axe audit.
  await Promise.all(
    document
      .getAnimations()
      .map((animation) => animation.finished.catch(() => {})),
  );
  return dialog;
}

export const Default: Story = {};

export const Open: Story = {
  args: { defaultOpen: true },
  play: async () => {
    await waitForDialog();
  },
};

export const WithoutCornerClose: Story = {
  render: (args) => <Example {...args} defaultOpen showCloseButton={false} />,
  play: async () => {
    const dialog = await waitForDialog();
    await expect(
      within(dialog).queryByRole('button', { name: 'Close' }),
    ).not.toBeInTheDocument();
    await expect(
      within(dialog).getByRole('button', { name: 'Cancel' }),
    ).toBeVisible();
  },
};

export const FooterClose: Story = {
  render: (args) => (
    <Example {...args} defaultOpen showCloseButton={false} footerClose />
  ),
  play: async () => {
    const dialog = await waitForDialog();
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Close' }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  },
};

export const DisabledTrigger: Story = {
  render: (args) => <Example {...args} disabled />,
  play: async ({ canvasElement, args }) => {
    const trigger = within(canvasElement).getByRole('button', {
      name: 'Open dialog',
    });
    await expect(trigger).toBeDisabled();
    await userEvent.tab();
    await expect(trigger).not.toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onOpenChange).not.toHaveBeenCalled();
    await expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  },
};

export const OpensAndCloses: Story = {
  play: async ({ canvasElement, args }) => {
    const trigger = within(canvasElement).getByRole('button', {
      name: 'Open dialog',
    });
    await userEvent.click(trigger);
    const dialog = await waitForDialog();
    await expect(dialog).toHaveAccessibleDescription(
      'Review the document details before continuing.',
    );
    await expect(args.onOpenChange).toHaveBeenCalledWith(
      true,
      expect.any(Object),
    );
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Close' }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(trigger).toHaveFocus());
    await expect(args.onOpenChange).toHaveBeenCalledWith(
      false,
      expect.any(Object),
    );
  },
};

export const KeyboardAndFocus: Story = {
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', {
      name: 'Open dialog',
    });
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    const dialog = await waitForDialog();
    const cancel = within(dialog).getByRole('button', { name: 'Cancel' });
    const close = within(dialog).getByRole('button', { name: 'Close' });
    await waitFor(() => expect(cancel).toHaveFocus());
    await userEvent.tab();
    await waitFor(() => expect(close).toHaveFocus());
    await userEvent.tab();
    await waitFor(() => expect(cancel).toHaveFocus());
    await userEvent.tab({ shift: true });
    await waitFor(() => expect(close).toHaveFocus());
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

export const OutsideClickDismissal: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Open dialog' }),
    );
    await waitForDialog();
    const overlay = document.querySelector<HTMLElement>(
      '[data-slot="dialog-overlay"]',
    );
    if (!overlay) throw new Error('Dialog overlay is missing');
    await userEvent.click(overlay);
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  },
};

export const PointerDismissalDisabled: Story = {
  args: { disablePointerDismissal: true },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Open dialog' }),
    );
    const dialog = await waitForDialog();
    const overlay = document.querySelector<HTMLElement>(
      '[data-slot="dialog-overlay"]',
    );
    if (!overlay) throw new Error('Dialog overlay is missing');
    await userEvent.click(overlay);
    await expect(dialog).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  },
};

/**
 * The owner decides whether the dialog is open. Cancel asks to close, and the dialog stays open
 * until `open` changes, which the Controls panel does here.
 */
export const Controlled: Story = {
  args: { open: true },
  play: async ({ args }) => {
    const dialog = await waitForDialog();
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Cancel' }),
    );
    await expect(args.onOpenChange).toHaveBeenCalledWith(
      false,
      expect.anything(),
    );
    await expect(dialog).toBeVisible();
  },
};

const onRename = fn();

/** Submitting the form reports the new name and closes the dialog. */
export const FormSubmission: Story = {
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger render={<Button variant="outline" />}>
        Rename document
      </DialogTrigger>
      <DialogContent
        initialFocus={() => document.getElementById('dialog-document-name')}
      >
        <DialogHeader>
          <DialogTitle>Rename document</DialogTitle>
          <DialogDescription>
            Choose a name for this document.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onRename(new FormData(event.currentTarget).get('name'));
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="dialog-document-name">Document name</Label>
            <Input
              id="dialog-document-name"
              name="name"
              defaultValue="Untitled"
              required
            />
          </div>
          <DialogFooter className="mt-4">
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <DialogClose render={<Button type="submit" />}>
              Save changes
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Rename document' }),
    );
    const dialog = await waitForDialog('Rename document');
    const input = within(dialog).getByRole('textbox', {
      name: 'Document name',
    });
    await waitFor(() => expect(input).toHaveFocus());
    await userEvent.clear(input);
    await userEvent.type(input, 'Research notes');
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Save changes' }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    await expect(onRename).toHaveBeenLastCalledWith('Research notes');
  },
};

export const LongContent: Story = {
  render: (args) => (
    <Dialog {...args} defaultOpen>
      <DialogContent className="max-h-96 overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Document activity</DialogTitle>
          <DialogDescription>
            Example activity entries demonstrate scrolling within the dialog.
          </DialogDescription>
        </DialogHeader>
        <ol className="grid gap-4">
          {Array.from({ length: 20 }, (_, index) => (
            <li key={index}>
              Example activity {index + 1}: A collaborator updated the document.
            </li>
          ))}
        </ol>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  ),
  play: async () => {
    await waitForDialog('Document activity');
  },
};
