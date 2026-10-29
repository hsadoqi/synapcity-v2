import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Globe } from 'lucide-react';

import { RootSidebar } from '.';
import { SidebarProvider } from '@synapcity/frontend-ui/core/sidebar';
import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';
import { ModeProvider } from '@synapcity/frontend-preferences';
import { ContextSwitcher } from '../../context-switcher';
import { SearchForm } from '../../search-form';
import { sampleSidebarGroups } from '../../../testing/sidebar-sample';

const meta: Meta<typeof RootSidebar> = {
  title: 'Blocks/RootSidebar',
  component: RootSidebar,
  tags: ['autodocs'],
  args: {
    groups: sampleSidebarGroups,
    header: (
      <ContextSwitcher
        current="Home"
        icon={<Globe className="size-4" />}
        options={[
          { label: 'Home', href: '#home' },
          { label: 'Spaces', href: '#spaces' },
        ]}
      />
    ),
  },
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <ModeProvider>
        <TooltipProvider>
          <SidebarProvider contained className="h-160">
            <Story />
          </SidebarProvider>
        </TooltipProvider>
      </ModeProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RootSidebar>;

export const Default: Story = {};

export const Right: Story = { args: { side: 'right' } };

/** Core links, a search form, and a collection with its action and records. */
export const WithSearchAndCollections: Story = {
  args: {
    groups: [
      sampleSidebarGroups[0]!,
      { content: <SearchForm /> },
      {
        title: 'Spaces',
        href: '#spaces',
        action: { label: 'New space', onSelect: () => {} },
        items: [
          { title: 'Writing', href: '#writing' },
          { title: 'Garden plans', href: '#garden' },
        ],
      },
      {
        title: 'Documents',
        href: '#documents',
        items: [],
        empty: 'No documents yet',
      },
    ],
  },
};

/** No sections and no header: only the small-screen footer and the rail. */
export const Empty: Story = { args: { groups: [], header: undefined } };
