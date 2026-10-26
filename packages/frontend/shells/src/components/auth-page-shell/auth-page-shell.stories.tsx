import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { AuthPageShell } from '.';

/** Centres the auth card and sets its width; the card itself comes from the feature. */
const meta = {
  title: 'Blocks/AuthPageShell',
  component: AuthPageShell,
  parameters: { layout: 'fullscreen' },
  args: {
    children: (
      <div className="rounded-lg bg-card p-6 text-card-foreground">
        <h1 className="text-lg font-semibold">Sign in</h1>
      </div>
    ),
  },
} satisfies Meta<typeof AuthPageShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
