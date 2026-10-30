import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CommandSearch } from '.';
import { fn } from 'storybook/test';
import { LayoutDashboard } from 'lucide-react';

const defaultDoc = {
  icon: LayoutDashboard,
  label: 'Doc1',
  onSelect: () => fn(),
  timestamp: new Date().toISOString(),
};

const meta: Meta<typeof CommandSearch> = {
  title: 'Blocks/Command Search',
  component: CommandSearch,
  args: {
    groups: [
      {
        heading: 'Documents',
        items: ['Doc1', 'Doc2', 'Doc3', 'Doc4', 'Doc5'].map((doc) => ({
          ...defaultDoc,
          label: doc,
        })),
      },
    ],
    emptyMessage: 'Empty',
    showSeparators: true,
    buttonLabel: 'Submit',
    placeholder: 'Command',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Empty: Story = {
  args: {
    groups: [],
  },
};
