import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FileText } from 'lucide-react';

import { sampleItems } from '../../testing';
import { ItemIconPreview } from './item-icon-preview';

const meta: Meta<typeof ItemIconPreview> = {
  title: 'Collection/ItemIconPreview',
  component: ItemIconPreview,
  tags: ['autodocs'],
  args: {
    item: sampleItems[0]!,
    icon: FileText,
    renderPreview: (item) => <p className="p-2 text-sm">{item.title}</p>,
  },
};

export default meta;
type Story = StoryObj<typeof ItemIconPreview>;

export const Default: Story = {};

/** Without a preview this is just the icon. */
export const JustTheIcon: Story = { args: { renderPreview: undefined } };
