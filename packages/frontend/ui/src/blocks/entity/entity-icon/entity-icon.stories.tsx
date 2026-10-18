import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { EntityIcon } from '@synapcity/frontend-ui/blocks/entity/entity-icon';

const meta: Meta<typeof EntityIcon> = {
  title: 'Blocks/Entity/EntityIcon',
  component: EntityIcon,
  tags: ['autodocs'],
  args: { name: 'book-open', className: 'size-6', 'aria-hidden': true },
};

export default meta;
type Story = StoryObj<typeof EntityIcon>;

export const Default: Story = {};

export const UnknownIdentifierFallsBackToFolder: Story = {
  args: { name: 'not-a-lucide-icon' },
};
