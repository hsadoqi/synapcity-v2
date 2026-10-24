import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import * as React from 'react';

import { ConfirmDialog } from '@synapcity/frontend-ui/components/confirm-dialog';
import { Button } from '@synapcity/frontend-ui/core/button';

const meta: Meta<typeof ConfirmDialog> = {
  title: 'Components/ConfirmDialog',
  component: ConfirmDialog,
  tags: ['autodocs'],
  args: {
    title: 'Delete “Weekly review”?',
    description:
      'This document will be gone for good. There’s no undo, so take a breath first.',
    confirmText: 'Delete document',
    cancelText: 'Keep it',
  },
};

export default meta;
type Story = StoryObj<typeof ConfirmDialog>;

/**
 * A controlled confirmation: the parent owns `open`. `onConfirm` runs only on
 * the confirm button; Cancel and Escape just close it.
 */
export const Destructive: Story = {
  args: { variant: 'destructive' },
  render: function Render(args) {
    const [open, setOpen] = React.useState(false);
    return (
      <>
        <Button variant="outline" onClick={() => setOpen(true)}>
          Delete…
        </Button>
        <ConfirmDialog
          {...args}
          open={open}
          onOpenChange={setOpen}
          onConfirm={() => {}}
        />
      </>
    );
  },
};

/** The default variant, for a confirmation that is not destructive. */
export const Default: Story = {
  args: {
    title: 'Leave without saving?',
    description: 'Your changes to this page will be lost.',
    confirmText: 'Leave',
    cancelText: 'Stay',
  },
  render: Destructive.render,
};
