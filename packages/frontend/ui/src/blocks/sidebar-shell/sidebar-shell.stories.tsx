import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { SidebarShell } from '@synapcity/frontend-ui/blocks/sidebar-shell';
import { ModeProvider } from '@synapcity/frontend-ui/providers/mode-provider';

const meta: Meta<typeof SidebarShell> = {
  title: 'Blocks/SidebarShell',
  component: SidebarShell,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    account: { homeHref: '/user-1/home', settingsHref: '/user-1/settings' },
    header: <div className="h-12 border-b px-4 text-xs">Header</div>,
    children: <p className="p-4 text-xs">Page content</p>,
  },
  decorators: [
    (Story) => (
      <ModeProvider>
        <Story />
      </ModeProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SidebarShell>;

export const Default: Story = {};

export const WithoutHeader: Story = { args: { header: null } };
