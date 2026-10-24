import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { EntityDetails } from './entity-details';
import type { DocumentItem } from '../../types';

const document: DocumentItem = {
  id: 'doc-1',
  name: 'Launch plan',
  description: 'Milestones, owners and open questions for the launch.',
  icon: 'file-text',
  kind: 'document',
  createdAt: '2026-10-01T12:00:00.000Z',
  updatedAt: '2026-10-16T09:30:00.000Z',
};

const meta: Meta<typeof EntityDetails> = {
  title: 'Blocks/Entity/EntityDetails',
  component: EntityDetails,
  tags: ['autodocs'],
  args: { entity: document, user: { name: 'Ada Lovelace' } },
};

export default meta;
type Story = StoryObj<typeof EntityDetails>;

export const Default: Story = {};

export const WithoutDescription: Story = {
  args: { entity: { ...document, description: undefined } },
};
