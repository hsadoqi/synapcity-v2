import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import { sampleSummaries, withStubNavigation } from '../../../testing';
import {
  SpacesCollection,
  SpacesCollectionSkeleton,
} from './spaces-collection';

const meta: Meta<typeof SpacesCollection> = {
  title: 'Spaces/SpacesCollection',
  component: SpacesCollection,
  tags: ['autodocs'],
  decorators: [withStubNavigation],
  args: {
    spaces: sampleSummaries,
    userId: 'u1',
    setSpacePinned: fn(async () => ({ ok: true as const, pinnedAt: null })),
  },
};

export default meta;
type Story = StoryObj<typeof SpacesCollection>;

export const Default: Story = {};

/** No spaces yet: the empty state, with no create button. */
export const Empty: Story = { args: { spaces: [] } };

/** The page while its spaces load: the real heading and intro over placeholders. */
export const Loading: Story = { render: () => <SpacesCollectionSkeleton /> };
