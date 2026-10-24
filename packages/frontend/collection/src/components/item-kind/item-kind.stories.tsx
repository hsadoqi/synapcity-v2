import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { sampleKinds } from '../../testing';
import { ItemKindTile } from './item-kind';

const meta: Meta<typeof ItemKindTile> = {
  title: 'Collection/ItemKindTile',
  component: ItemKindTile,
  tags: ['autodocs'],
  args: { kind: sampleKinds.document! },
};

export default meta;
type Story = StoryObj<typeof ItemKindTile>;

/** The kind's icon in a bordered tile, with its name for screen readers. */
export const Default: Story = {};

export const Medium: Story = { args: { size: 'md' } };

export const Dashboard: Story = { args: { kind: sampleKinds.dashboard! } };
