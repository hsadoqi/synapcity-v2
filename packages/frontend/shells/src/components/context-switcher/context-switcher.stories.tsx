import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { ContextSwitcher } from '.';
import { SidebarProvider } from '@synapcity/frontend-ui/core/sidebar';
import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';

const meta: Meta<typeof ContextSwitcher> = {
  title: 'Blocks/ContextSwitcher',
  component: ContextSwitcher,
  tags: ['autodocs'],
  args: {
    current: 'Home',
    options: [
      { label: 'Home', href: '#home' },
      { label: 'Spaces', href: '#spaces' },
      { label: 'Documents', href: '#documents' },
      { label: 'Dashboards', href: '#dashboards' },
    ],
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

/** Inside a Space, the switcher names the Space; no option is checked. */
export const InASpace: Story = { args: { current: 'Garden plans' } };
