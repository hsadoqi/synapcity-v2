import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import {
  sampleEmptySpace,
  sampleSpace,
  withStubNavigation,
} from '../../../testing';
import { SpaceCollections } from './space-collections';

const meta: Meta<typeof SpaceCollections> = {
  title: 'Spaces/SpaceCollections',
  component: SpaceCollections,
  tags: ['autodocs'],
  decorators: [withStubNavigation],
  args: { homePath: '/u1/home', space: sampleSpace },
};

export default meta;
type Story = StoryObj<typeof SpaceCollections>;

export const Default: Story = {};

/** Nothing takes part in the space yet. */
export const Empty: Story = { args: { space: sampleEmptySpace } };
