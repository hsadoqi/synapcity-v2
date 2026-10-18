import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@synapcity/frontend-ui/core/hover-card';

const meta: Meta<typeof HoverCard> = {
  title: 'Components/HoverCard',
  component: HoverCard,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="flex min-h-64 items-start justify-center p-8">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof HoverCard>;

export const Default: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger render={<span className="text-sm underline" />}>
        Hover for a preview
      </HoverCardTrigger>
      <HoverCardContent>
        <p className="font-heading text-sm font-medium">Writing</p>
        <p className="text-muted-foreground">
          Ideas, drafts, and reference material for writing.
        </p>
      </HoverCardContent>
    </HoverCard>
  ),
};

/** Open on first paint so the surface can be inspected without hovering. */
export const Open: Story = {
  render: () => (
    <HoverCard defaultOpen>
      <HoverCardTrigger render={<span className="text-sm underline" />}>
        Anchor
      </HoverCardTrigger>
      <HoverCardContent align="start">
        <p className="font-heading text-sm font-medium">Always visible</p>
        <p className="text-muted-foreground">Aligned to the trigger’s start.</p>
      </HoverCardContent>
    </HoverCard>
  ),
};
