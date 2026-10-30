import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Kbd } from './kbd';

const meta: Meta<typeof Kbd> = {
  title: 'Blocks/Kbd',
  component: Kbd,
  args: {
    about: 'K',
    accessKey: 'space',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
