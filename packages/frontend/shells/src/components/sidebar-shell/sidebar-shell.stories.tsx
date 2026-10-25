import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { SidebarShell } from '.';
import { ModeProvider } from '@synapcity/frontend-preferences';
import { RootSidebar } from './root-sidebar';
import { sampleSidebarGroups } from '../../testing/sidebar-sample';

const meta: Meta<typeof SidebarShell> = {
  title: 'Blocks/SidebarShell',
  component: SidebarShell,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    sidebar: (
      <RootSidebar
        settingsHref="/user-1/settings"
        groups={sampleSidebarGroups}
      />
    ),
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
