import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FileText } from 'lucide-react';

import { ItemIcon } from './item-icon';

const meta: Meta<typeof ItemIcon> = {
  title: 'Collection/ItemIcon',
  component: ItemIcon,
  tags: ['autodocs'],
  args: { icon: FileText, name: 'pen-line' },
};

export default meta;
type Story = StoryObj<typeof ItemIcon>;

export const Default: Story = {};

/** Without its own icon name, the consumer’s icon is used. */
export const Fallback: Story = { args: { name: undefined } };
