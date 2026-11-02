import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ModeProvider } from '@synapcity/frontend-preferences';

import { SettingsContent } from './components/shared/settings-page/settings-content';

function AccountPreview() {
  return <p className="text-sm text-muted-foreground">Account details</p>;
}

const meta = {
  title: 'Features/Settings/Settings content',
  component: SettingsContent,
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <ModeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <SettingsContent {...args} accountTab={async () => AccountPreview} />
    </ModeProvider>
  ),
} satisfies Meta<typeof SettingsContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { name: 'Ada Lovelace' },
};
