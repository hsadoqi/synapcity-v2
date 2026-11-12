import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { NamedIcon } from '.';

const meta: Meta<typeof NamedIcon> = {
  title: 'Components/NamedIcon',
  component: NamedIcon,
  tags: ['autodocs'],
  args: { name: 'book-open', 'aria-hidden': true, className: 'size-6' },
};

export default meta;
type Story = StoryObj<typeof NamedIcon>;

/** A record's icon, stored as a lucide name in kebab-case. */
export const Default: Story = {};

/** A name the shell does not list falls back to a folder. */
export const UnknownName: Story = { args: { name: 'not-an-icon' } };
