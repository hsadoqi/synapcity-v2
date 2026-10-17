import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Button } from '@synapcity/frontend-ui/core/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@synapcity/frontend-ui/core/sheet';

const meta: Meta<typeof Sheet> = {
  title: 'Components/Sheet',
  component: Sheet,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof Sheet>;

const Example = ({
  side,
  showCloseButton,
  defaultOpen,
}: {
  side?: 'top' | 'right' | 'bottom' | 'left';
  showCloseButton?: boolean;
  defaultOpen?: boolean;
}) => (
  <Sheet defaultOpen={defaultOpen}>
    <SheetTrigger render={<Button variant="outline" />}>Open</SheetTrigger>
    <SheetContent side={side} showCloseButton={showCloseButton}>
      <SheetHeader>
        <SheetTitle>Edit profile</SheetTitle>
        <SheetDescription>Change how you appear to others.</SheetDescription>
      </SheetHeader>
      <SheetFooter>
        <Button>Save</Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
);

export const Closed: Story = { render: () => <Example /> };

export const Right: Story = { render: () => <Example defaultOpen /> };

export const Left: Story = {
  render: () => <Example defaultOpen side="left" />,
};

export const Top: Story = {
  render: () => <Example defaultOpen side="top" />,
};

export const Bottom: Story = {
  render: () => <Example defaultOpen side="bottom" />,
};

export const WithoutCloseButton: Story = {
  render: () => <Example defaultOpen showCloseButton={false} />,
};
