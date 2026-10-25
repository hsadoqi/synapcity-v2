import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { RootHeader } from '.';
import { AuthButtons } from '@synapcity/frontend-ui/components/auth-buttons';
import { UserMenu } from '@synapcity/frontend-ui/components/user-menu';
import { ModeProvider } from '@synapcity/frontend-preferences';
import { SidebarProvider } from '@synapcity/frontend-ui/core/sidebar';
import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';

const meta: Meta<typeof RootHeader> = {
  title: 'Blocks/RootHeader',
  component: RootHeader,
  tags: ['autodocs'],
  // The header spans the page; centred, it shrinks to its content and hides how it lays out.
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <ModeProvider>
        <Story />
      </ModeProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RootHeader>;

export const Default: Story = {
  args: {},
};

export const SignedOut: Story = {
  args: {
    actions: (
      <AuthButtons
        signInHref="/sign-in"
        signUpHref="/sign-up"
        variant="header"
      />
    ),
  },
};

export const SignedIn: Story = {
  args: {
    actions: (
      <UserMenu
        homeHref="/user-1/home"
        settingsHref="/user-1/settings"
        name="Hanaa Sadoqi"
        email="hanaa@example.com"
        imageUrl={null}
      />
    ),
  },
};

const account = { homeHref: '/user-1/home', settingsHref: '/user-1/settings' };

/** Signed in, so the header carries the sidebar trigger and the trail. */
const signedInDecorators: Meta<typeof RootHeader>['decorators'] = [
  (Story) => (
    <TooltipProvider>
      <SidebarProvider>
        {/* The shell puts the header in a stretching column; SidebarProvider is a row. */}
        <div className="flex min-w-0 flex-1 flex-col">
          <Story />
        </div>
      </SidebarProvider>
    </TooltipProvider>
  ),
];

export const WithBreadcrumbs: Story = {
  decorators: signedInDecorators,
  args: {
    account,
    breadcrumbs: [
      { label: 'Spaces', href: '/user-1/home/spaces' },
      { label: 'Fitness' },
    ],
  },
};

export const WithLongBreadcrumbs: Story = {
  decorators: signedInDecorators,
  args: {
    account,
    breadcrumbs: [
      { label: 'Spaces', href: '/user-1/home/spaces' },
      {
        label:
          'Training plans for the spring marathon block, weeks one to sixteen',
      },
    ],
  },
};
