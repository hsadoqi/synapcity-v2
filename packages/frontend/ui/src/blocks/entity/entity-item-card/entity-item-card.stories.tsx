import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { EntityItemCard } from '@synapcity/frontend-ui/blocks/entity/entity-item-card';
import type { DocumentItem } from '@synapcity/frontend-ui/types/entity';

const document: DocumentItem = {
  id: 'doc-1',
  name: 'Launch plan',
  description: 'Milestones, owners and open questions for the launch.',
  icon: 'file-text',
  kind: 'document',
  createdAt: '2026-10-01T12:00:00.000Z',
  updatedAt: '2026-10-16T09:30:00.000Z',
};

const meta: Meta<typeof EntityItemCard> = {
  title: 'Blocks/Entity/EntityItemCard',
  component: EntityItemCard,
  tags: ['autodocs'],
  args: { entity: document, slug: '/u1/home/spaces/s1/documents' },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof EntityItemCard>;

export const Default: Story = {};

export const WithoutDescription: Story = {
  args: { entity: { ...document, description: undefined } },
};
