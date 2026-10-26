import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { sampleSummaries, withStubNavigation } from '../../../testing';
import { DocumentsIndex } from './documents-index';

const meta: Meta<typeof DocumentsIndex> = {
  title: 'Documents/DocumentsIndex',
  component: DocumentsIndex,
  tags: ['autodocs'],
  decorators: [withStubNavigation],
  args: {
    documents: sampleSummaries,
    homePath: '/u1/home',
    now: '2026-10-20T12:00:00Z',
    setDocumentPinned: fn(async () => ({
      ok: true as const,
      pinnedAt: '2026-10-20T12:00:00Z',
    })),
  },
};

export default meta;
type Story = StoryObj<typeof DocumentsIndex>;

export const Default: Story = {};

/** Pin in a document's menu saves through the host's action. */
export const PinsThroughTheHost: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);

    await userEvent.click(
      canvas.getAllByRole('button', { name: 'Actions for Reading notes' })[0]!,
    );
    await userEvent.click(await page.findByRole('menuitem', { name: 'Pin' }));

    await expect(args.setDocumentPinned).toHaveBeenCalledWith(
      'fixture-document-reading-notes',
      true,
    );
    // Let the menu finish closing so its focus guards are gone before the
    // a11y check runs on the settled story.
    await waitFor(() => expect(page.queryByRole('menu')).toBeNull());
  },
};
