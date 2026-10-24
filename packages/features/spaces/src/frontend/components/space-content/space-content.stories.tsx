import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import {
  sampleEmptySpace,
  sampleSpace,
  withStubNavigation,
} from '../../../testing';
import { SpaceContent } from './space-content';

const meta: Meta<typeof SpaceContent> = {
  title: 'Spaces/SpaceContent',
  component: SpaceContent,
  tags: ['autodocs'],
  decorators: [withStubNavigation],
  args: { homePath: '/u1/home', space: sampleSpace },
};

export default meta;
type Story = StoryObj<typeof SpaceContent>;

export const Default: Story = {};

/** Nothing takes part in the space yet: both empty states. */
export const Empty: Story = { args: { space: sampleEmptySpace } };

/** What takes part in the space could not be read: an alert, not empty states. */
export const ItemsUnavailable: Story = {
  args: { space: { ...sampleEmptySpace, itemsUnavailable: true } },
};
