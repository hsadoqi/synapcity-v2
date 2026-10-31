import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { BreadcrumbProvider } from './breadcrumb-trail';
import { BreadcrumbMenu } from '../breadcrumb-menu';
const account = { homeHref: '/u/home', settingsHref: '/u/settings' };

/** A page sets its trail with `Breadcrumb`; the shell's header shows it. */
const meta = {
  title: 'Blocks/BreadcrumbProvider',
  component: BreadcrumbProvider,
  parameters: { layout: 'fullscreen' },
  args: { account, children: null },
} satisfies Meta<typeof BreadcrumbProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InASpace: Story = {
  args: {
    children: (
      <>
        <BreadcrumbMenu
          items={[
            { label: 'Spaces', href: '/u/home/spaces' },
            { label: 'Garden plans' },
          ]}
        />
        <p className="p-4">Page content</p>
      </>
    ),
  },
};

export const NoTrail: Story = {
  args: { children: <p className="p-4">A page that sets no trail</p> },
};
