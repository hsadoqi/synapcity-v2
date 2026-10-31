import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useArgs } from 'storybook/preview-api';
import { HomeIcon, Settings } from 'lucide-react';

import { Button } from '@synapcity/frontend-ui/core/button';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@synapcity/frontend-ui/core/command';

const meta = {
  title: 'Components/Command',
  component: Command,
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

const Items = () => (
  <>
    <CommandInput placeholder="Type a command or search…" />
    <CommandList>
      <CommandEmpty>No results found.</CommandEmpty>
      <CommandGroup heading="Go to">
        <CommandItem>
          <HomeIcon aria-hidden />
          Home
        </CommandItem>
        <CommandItem>
          <Settings aria-hidden />
          Settings
          <CommandShortcut>⌘,</CommandShortcut>
        </CommandItem>
      </CommandGroup>
    </CommandList>
  </>
);

export const Inline: Story = {
  render: () => (
    <Command className="w-80 border border-border">
      <Items />
    </Command>
  ),
};

export const InADialog: Story = {
  render: function Render() {
    const [{ open = false }, updateArgs] = useArgs<{ open?: boolean }>();
    const setOpen = (next: boolean) => updateArgs({ open: next });
    return (
      <>
        <Button variant="outline" onClick={() => setOpen(true)}>
          Open palette
        </Button>
        <CommandDialog open={open} onOpenChange={setOpen}>
          <Command>
            <Items />
          </Command>
        </CommandDialog>
      </>
    );
  },
};
