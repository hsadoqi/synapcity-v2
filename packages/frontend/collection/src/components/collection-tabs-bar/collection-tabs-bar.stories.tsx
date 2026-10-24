import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Tabs } from '@synapcity/frontend-ui/core/tabs';

import { CollectionTabsBar } from './collection-tabs-bar';

const meta: Meta<typeof CollectionTabsBar> = {
  title: 'Collection/CollectionTabsBar',
  component: CollectionTabsBar,
  tags: ['autodocs'],
  args: {
    overviewLabel: 'Overview',
    tabs: [
      { id: 'documents', label: 'Documents' },
      { id: 'dashboards', label: 'Dashboards' },
    ],
  },
  decorators: [
    (Story) => (
      <Tabs defaultValue="overview">
        <Story />
      </Tabs>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CollectionTabsBar>;

export const Default: Story = {};

/** Only the collection tabs. */
export const WithoutOverview: Story = { args: { overviewLabel: undefined } };
