import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { FileText } from 'lucide-react';

import { CollectionNavigationProvider } from '../../providers';
import {
  sampleItems,
  sampleLabels,
  sampleEmptyCopy,
  sampleNowIso,
} from '../../testing';
import { CollectionIndex } from './collection-index';

/** A stub host: links and the Open action report here instead of leaving the story. */
const push = fn();

const meta: Meta<typeof CollectionIndex> = {
  title: 'Collection/CollectionIndex',
  component: CollectionIndex,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <CollectionNavigationProvider
        value={{
          Link: ({ href, onClick, ...props }) => (
            <a
              href={href}
              onClick={(event) => {
                onClick?.(event);
                event.preventDefault();
                push(href);
              }}
              {...props}
            />
          ),
          push,
        }}
      >
        <Story />
      </CollectionNavigationProvider>
    ),
  ],
  beforeEach: () => {
    push.mockClear();
  },
  args: {
    items: sampleItems,
    now: sampleNowIso,
    labels: sampleLabels,
    icon: FileText,
    heading: 'All documents',
    recentHeading: 'Recently opened',
    pinnedHeading: 'Pinned',
    pinnedEmptyMessage: 'Pin something to keep it here.',
    emptyState: sampleEmptyCopy,
    actions: ['open', 'toggle-pin'],
    onSetPinned: fn(async () => ({ ok: true as const })),
  },
};

export default meta;
type Story = StoryObj<typeof CollectionIndex>;

export const Default: Story = {};

/** Open in an item's menu goes to the item's address through the host. */
export const OpensThroughTheHost: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);

    await userEvent.click(
      canvas.getAllByRole('button', { name: 'Actions for Reading notes' })[0]!,
    );
    await userEvent.click(await page.findByRole('menuitem', { name: 'Open' }));

    await expect(push).toHaveBeenCalledWith('/home/documents/d2');
    // Let the menu finish closing so its focus guards are gone before the
    // a11y check runs on the settled story.
    await waitFor(() => expect(page.queryByRole('menu')).toBeNull());
  },
};

/** No items: the empty state. */
export const Empty: Story = { args: { items: [] } };

/** At or below the threshold the highlights are left out. */
export const FewItems: Story = { args: { items: sampleItems.slice(0, 3) } };
