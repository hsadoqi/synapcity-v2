import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { ScrollArea } from '@synapcity/frontend-ui/core/scroll-area';
import { Separator } from '@synapcity/frontend-ui/core/separator';

const meta: Meta<typeof ScrollArea> = {
  title: 'Components/ScrollArea',
  component: ScrollArea,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ScrollArea>;

const notes = Array.from({ length: 30 }, (_, index) => `Note ${index + 1}`);

export const Vertical: Story = {
  render: (args) => (
    <ScrollArea {...args} className="h-48 w-56 rounded-md border">
      <div className="flex flex-col gap-2 p-3 text-sm">
        {notes.map((note) => (
          <div key={note}>
            {note}
            <Separator className="mt-2" />
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const Horizontal: Story = {
  render: (args) => (
    <ScrollArea {...args} className="w-64 rounded-md border">
      <div className="flex w-max gap-3 p-3 text-sm">
        {notes.slice(0, 12).map((note) => (
          <span key={note} className="rounded-md border px-3 py-2">
            {note}
          </span>
        ))}
      </div>
    </ScrollArea>
  ),
};

/** Content that fits shows no overflow to scroll. */
export const ShortContent: Story = {
  render: (args) => (
    <ScrollArea {...args} className="h-48 w-56 rounded-md border">
      <p className="p-3 text-sm">Nothing here needs scrolling.</p>
    </ScrollArea>
  ),
};
