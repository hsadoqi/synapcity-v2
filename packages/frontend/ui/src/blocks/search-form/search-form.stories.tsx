import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { SearchForm } from '@synapcity/frontend-ui/blocks/search-form';
import { SidebarProvider } from '@synapcity/frontend-ui/core/sidebar';

const meta: Meta<typeof SearchForm> = {
  title: 'Blocks/SearchForm',
  component: SearchForm,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <SidebarProvider className="min-h-0 w-72">
        <Story />
      </SidebarProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SearchForm>;

export const Default: Story = {};
