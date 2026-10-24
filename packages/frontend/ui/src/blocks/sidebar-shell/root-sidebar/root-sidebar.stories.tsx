import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { RootSidebar } from '@synapcity/frontend-ui/blocks/sidebar-shell/root-sidebar';
import { SidebarProvider } from '@synapcity/frontend-ui/core/sidebar';
import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';
import { ModeProvider } from '@synapcity/frontend-preferences';

const meta: Meta<typeof RootSidebar> = {
  title: 'Blocks/RootSidebar',
  component: RootSidebar,
  tags: ['autodocs'],
  args: { settingsHref: '/user-1/settings' },
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
