import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { sampleLabels } from '../../testing';
import { CollectionHeader } from './collection-header';

const meta: Meta<typeof CollectionHeader> = {
  title: 'Collection/CollectionHeader',
  component: CollectionHeader,
  tags: ['autodocs'],
  args: { labels: sampleLabels, count: 6, loading: false },
};

export default meta;
type Story = StoryObj<typeof CollectionHeader>;

export const Default: Story = {};

/** The space the collection lives in shows above the title. */
export const WithContext: Story = { args: { context: 'Writing' } };

/** While loading, the count is not shown. */
export const Loading: Story = { args: { loading: true } };

/** A page with its own heading replaces the plural. */
export const OwnHeading: Story = { args: { heading: 'All documents' } };
