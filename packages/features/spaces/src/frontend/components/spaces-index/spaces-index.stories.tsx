import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { sampleSummaries, withStubNavigation } from '../../../testing';
import { SpacesIndex } from './spaces-index';

const meta: Meta<typeof SpacesIndex> = {
  title: 'Spaces/SpacesIndex',
  component: SpacesIndex,
  tags: ['autodocs'],
  decorators: [withStubNavigation],
  args: {
    spaces: sampleSummaries,
    userId: 'u1',
    now: '2026-10-20T12:00:00Z',
    setSpacePinned: fn(async () => ({
      ok: true as const,
      pinnedAt: '2026-10-20T12:00:00Z',
    })),
  },
};

export default meta;
type Story = StoryObj<typeof SpacesIndex>;

export const Default: Story = {};

/** Pin in a space's menu saves through the host's action. */
export const PinsThroughTheHost: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);

    await userEvent.click(
      canvas.getAllByRole('button', { name: 'Actions for Learning' })[0]!,
    );
    await userEvent.click(await page.findByRole('menuitem', { name: 'Pin' }));

    await expect(args.setSpacePinned).toHaveBeenCalledWith(
      'fixture-space-learning',
      true,
    );
    // Let the menu finish closing so its focus guards are gone before the
    // a11y check runs on the settled story.
    await waitFor(() => expect(page.queryByRole('menu')).toBeNull());
  },
};
