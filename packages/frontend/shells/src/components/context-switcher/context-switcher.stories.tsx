import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { ContextSwitcher } from '.';
import { SidebarProvider } from '@synapcity/frontend-ui/core/sidebar';
import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';

const meta: Meta<typeof ContextSwitcher> = {
  title: 'Blocks/ContextSwitcher',
  component: ContextSwitcher,
  tags: ['autodocs'],
  args: {
    versions: ['1.0.1', '1.1.0-alpha', '2.0.0-beta1'],
    defaultVersion: '1.0.1',
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

export const SecondVersionSelected: Story = {
  args: { defaultVersion: '1.1.0-alpha' },
};
