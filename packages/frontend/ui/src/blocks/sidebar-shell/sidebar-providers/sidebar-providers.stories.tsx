import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { SidebarProviders } from '@synapcity/frontend-ui/blocks/sidebar-shell/sidebar-providers';
import { SidebarTrigger } from '@synapcity/frontend-ui/core/sidebar';

const meta: Meta<typeof SidebarProviders> = {
  title: 'Blocks/SidebarProviders',
  component: SidebarProviders,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SidebarProviders>;

/** Wraps children in the tooltip and sidebar providers, with the sidebar closed. */
export const Default: Story = {
  args: {
    children: (
      <div className="p-4">
        <SidebarTrigger />
      </div>
    ),
  },
};
