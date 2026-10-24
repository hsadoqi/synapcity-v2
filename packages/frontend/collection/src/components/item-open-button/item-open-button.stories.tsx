import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import { ItemOpenButton } from './item-open-button';

const meta: Meta<typeof ItemOpenButton> = {
  title: 'Collection/ItemOpenButton',
  component: ItemOpenButton,
  tags: ['autodocs'],
  args: { title: 'Launch plan', onOpen: fn(), href: '#opens-the-item' },
};

export default meta;
type Story = StoryObj<typeof ItemOpenButton>;

export const Default: Story = {};

/** Without an address the title is a button that calls `onOpen`. */
export const Button: Story = { args: { href: undefined } };
