import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Globe, Sprout } from 'lucide-react';

import { ContextSwitcher } from '.';
import { SidebarProvider } from '@synapcity/frontend-ui/core/sidebar';
import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';

const meta: Meta<typeof ContextSwitcher> = {
  title: 'Blocks/ContextSwitcher',
  component: ContextSwitcher,
  tags: ['autodocs'],
  args: {
    current: 'Global',
    icon: <Globe className="size-4" />,
    options: [
      { label: 'Global', href: '#global', active: true },
      { label: 'Writing', href: '#writing' },
      { label: 'Garden plans', href: '#garden' },
    ],
    more: { label: 'All spaces', href: '#spaces' },
  },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <SidebarProvider className="min-h-48 w-72 p-2">
          <div className="w-full">
            <Story />
          </div>
        </SidebarProvider>
      </TooltipProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ContextSwitcher>;

export const Default: Story = {};

/** Inside a Space, the switcher shows the Space's own icon and name, and checks it. */
export const InASpace: Story = {
  args: {
    current: 'Garden plans',
    icon: <Sprout className="size-4" />,
    options: [
      { label: 'Global', href: '#global' },
      { label: 'Writing', href: '#writing' },
      { label: 'Garden plans', href: '#garden', active: true },
    ],
  },
};
