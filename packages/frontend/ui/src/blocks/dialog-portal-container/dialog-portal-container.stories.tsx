import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';

import { Button } from '@synapcity/frontend-ui/core/button';
import { DialogPortalContainer } from '@synapcity/frontend-ui/blocks/dialog-portal-container';

const longBody = (
  <div className="flex flex-col gap-2 pr-3 text-sm text-muted-foreground">
    {Array.from({ length: 30 }, (_, i) => (
      <p key={i}>Setting row {i + 1}</p>
    ))}
  </div>
);

const meta = {
  title: 'Components/Dialog Portal Container',
  component: DialogPortalContainer,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    trigger: <Button variant="outline">Open dialog</Button>,
    title: 'Settings',
    description: 'Configure this block.',
    children: <p className="text-sm">Dialog body.</p>,
  },
  argTypes: {
    container: { control: 'select', options: ['inline', 'body'] },
    width: { control: 'select', options: ['sm', 'md', 'lg', 'full'] },
    height: { control: 'select', options: ['sm', 'md', 'lg', 'full'] },
    modal: { control: 'select', options: [true, false, 'trap-focus'] },
    overlay: { control: 'boolean' },
    showCloseButton: { control: 'boolean' },
    scrollable: { control: 'boolean' },
    trigger: { control: false },
    footer: { control: false },
  },
} satisfies Meta<typeof DialogPortalContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

const open = async (canvasElement: HTMLElement) => {
  await userEvent.click(
    within(canvasElement).getByRole('button', { name: 'Open dialog' }),
  );
  return screen.findByRole('dialog');
};

export const Default: Story = {};

/** Inline is the default: the dialog renders inside its scope and takes that scope's theme. */
export const InheritsLocalTheme: Story = {
  render: (args) => (
    <div className="theme-dark dark:theme-light rounded-xl bg-background p-6 text-foreground">
      <DialogPortalContainer {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const dialog = await open(canvasElement);
    expect(canvasElement.contains(dialog)).toBe(true);
  },
};

export const RenderedInBody: Story = {
  args: { container: 'body' },
  play: async ({ canvasElement }) => {
    const dialog = await open(canvasElement);
    expect(canvasElement.contains(dialog)).toBe(false);
  },
};

export const Scrollable: Story = {
  args: { scrollable: true, children: longBody },
  play: async ({ canvasElement }) => {
    const dialog = await open(canvasElement);
    await waitFor(() => {
      const viewport = dialog.querySelector(
        '[data-slot="scroll-area-viewport"]',
      );
      expect(viewport).not.toBeNull();
      expect(viewport!.scrollHeight).toBeGreaterThan(viewport!.clientHeight);
      expect(dialog.getBoundingClientRect().height).toBeLessThanOrEqual(
        window.innerHeight,
      );
    });
  },
};

export const WithFooter: Story = {
  args: {
    footer: (
      <>
        <Button variant="outline">Cancel</Button>
        <Button>Save</Button>
      </>
    ),
  },
};

export const NonModalWithoutOverlay: Story = {
  args: { modal: false, overlay: false },
};

export const Large: Story = {
  args: { width: 'lg', height: 'lg', scrollable: true, children: longBody },
};
