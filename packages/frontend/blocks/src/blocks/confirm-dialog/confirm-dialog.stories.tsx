import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';

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
    open: false,
    onOpenChange: fn(),
    onConfirm: fn(),
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
    const [, updateArgs] = useArgs();
    return (
      <>
        <Button variant="outline" onClick={() => updateArgs({ open: true })}>
          Delete…
        </Button>
        <ConfirmDialog
          {...args}
          onOpenChange={(open) => {
            updateArgs({ open });
            args.onOpenChange(open);
          }}
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
