import type { Meta, StoryObj } from '@storybook/nextjs-vite';

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
    settingsHref: '/user-1/settings',
    groups: sampleSidebarGroups,
    header: (
      <>
        <ContextSwitcher
          current="Home"
          options={[
            { label: 'Home', href: '#home' },
            { label: 'Spaces', href: '#spaces' },
          ]}
        />
        <SearchForm />
      </>
    ),
  },
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <ModeProvider>
        <TooltipProvider>
          <SidebarProvider className="min-h-160">
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

/** No sections and no header: only the small-screen footer and the rail. */
export const Empty: Story = { args: { groups: [], header: undefined } };
