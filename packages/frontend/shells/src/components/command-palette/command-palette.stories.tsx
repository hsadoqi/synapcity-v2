import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { FileText, HomeIcon, Plus, Settings } from 'lucide-react';

import { CommandPalette } from '.';

const meta = {
  title: 'Blocks/CommandPalette',
  component: CommandPalette,
  args: {
    open: true,
    onOpenChange: fn(),
    onNavigate: fn(),
    groups: [
      {
        heading: 'Go to',
        items: [
          { label: 'Home', href: '#home', icon: HomeIcon },
          { label: 'Settings', href: '#settings', icon: Settings },
        ],
      },
      {
        heading: 'Documents',
        items: [
          { label: 'Launch checklist', href: '#doc-1', icon: FileText },
          { label: 'Reading notes', href: '#doc-2', icon: FileText },
        ],
      },
      {
        heading: 'Create',
        items: [{ label: 'New document', onSelect: fn(), icon: Plus }],
      },
    ],
  },
} satisfies Meta<typeof CommandPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};

/** Opened from the sidebar's search field, with what was typed there. */
export const WithSearch: Story = { args: { search: 'launch' } };
