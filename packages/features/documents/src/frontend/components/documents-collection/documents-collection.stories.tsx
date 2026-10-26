import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import { sampleSummaries, withStubNavigation } from '../../../testing';
import {
  DocumentsCollection,
  DocumentsCollectionSkeleton,
} from './documents-collection';

const meta: Meta<typeof DocumentsCollection> = {
  title: 'Documents/DocumentsCollection',
  component: DocumentsCollection,
  tags: ['autodocs'],
  decorators: [withStubNavigation],
  args: {
    documents: sampleSummaries,
    homePath: '/u1/home',
    setDocumentPinned: fn(async () => ({ ok: true as const, pinnedAt: null })),
  },
};

export default meta;
type Story = StoryObj<typeof DocumentsCollection>;

export const Default: Story = {};

/** No documents yet: the empty state, with no create button. */
export const Empty: Story = { args: { documents: [] } };

/** The page while its documents load: the real heading and intro over placeholders. */
export const Loading: Story = { render: () => <DocumentsCollectionSkeleton /> };
