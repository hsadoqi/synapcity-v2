import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { SkipLinkButton } from '@synapcity/frontend-ui/components/skip-link';

const meta: Meta<typeof SkipLinkButton> = {
  title: 'Components/SkipLink',
  component: SkipLinkButton,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof SkipLinkButton>;

/**
 * Hidden above the viewport until it takes keyboard focus. Press Tab to reveal it;
 * the link jumps to `#main-content`, which the root shell provides.
 */
export const Default: Story = {
  render: () => (
    <div className="min-h-32">
      <SkipLinkButton />
      <main id="main-content" className="p-8 text-xs">
        Main content
      </main>
    </div>
  ),
};
