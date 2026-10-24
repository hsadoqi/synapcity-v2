import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn } from 'storybook/test';

import { RecordSpaceView } from './record-space-view';

const meta: Meta<typeof RecordSpaceView> = {
  title: 'Spaces/RecordSpaceView',
  component: RecordSpaceView,
  tags: ['autodocs'],
  args: {
    spaceId: 's1',
    recordSpaceView: fn(async () => {}),
  },
};

export default meta;
type Story = StoryObj<typeof RecordSpaceView>;

/** Renders nothing; once on screen it records one view through the host's action. */
export const RecordsTheView: Story = {
  play: async ({ args }) => {
    await expect(args.recordSpaceView).toHaveBeenCalledTimes(1);
    await expect(args.recordSpaceView).toHaveBeenCalledWith('s1');
  },
};
