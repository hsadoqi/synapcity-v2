import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { RootHeader } from '@synapcity/frontend-ui/blocks/root-shell/root-header';
import { AuthButtons } from '@synapcity/frontend-ui/components/auth-buttons';
import { UserMenu } from '@synapcity/frontend-ui/components/user-menu';
import { ModeProvider } from '@synapcity/frontend-ui/providers/mode-provider';

const meta: Meta<typeof RootHeader> = {
  title: 'Blocks/RootHeader',
  component: RootHeader,
  tags: ['autodocs'],
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
