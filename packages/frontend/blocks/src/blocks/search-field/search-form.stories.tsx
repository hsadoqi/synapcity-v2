import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { SearchForm, SearchInput } from '.';
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

export const WithQuery: Story = {
  args: { defaultValue: 'garden', placeholder: 'Search notes…' },
};

/** The bare control, as a renderer hands it to a form field. */
export const Input: Story = {
  render: () => <SearchInput aria-label="Search" placeholder="Search…" />,
};
