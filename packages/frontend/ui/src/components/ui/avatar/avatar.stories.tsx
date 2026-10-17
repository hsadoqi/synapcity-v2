import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { UserRound } from 'lucide-react';

import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from '@synapcity/frontend-ui/core/avatar';

const meta: Meta<typeof Avatar> = {
  title: 'Components/Avatar',
  component: Avatar,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Avatar>;

/** No image loads, so the fallback shows. An icon stands in for initials. */
export const Default: Story = {
  render: (args) => (
    <Avatar {...args}>
      <AvatarFallback>
        <UserRound aria-hidden />
      </AvatarFallback>
    </Avatar>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      {(['sm', 'default', 'lg'] as const).map((size) => (
        <Avatar key={size} size={size}>
          <AvatarFallback>
            <UserRound aria-hidden />
          </AvatarFallback>
        </Avatar>
      ))}
    </div>
  ),
};

export const WithBadge: Story = {
  render: () => (
    <Avatar>
      <AvatarFallback>
        <UserRound aria-hidden />
      </AvatarFallback>
      <AvatarBadge />
    </Avatar>
  ),
};

export const Group: Story = {
  render: () => (
    <AvatarGroup>
      {[1, 2, 3].map((n) => (
        <Avatar key={n}>
          <AvatarFallback>
            <UserRound aria-hidden />
          </AvatarFallback>
        </Avatar>
      ))}
      <AvatarGroupCount>+4</AvatarGroupCount>
    </AvatarGroup>
  ),
};
