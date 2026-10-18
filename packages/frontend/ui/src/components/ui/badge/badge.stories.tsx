import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CheckIcon, XIcon } from 'lucide-react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { Badge } from '@synapcity/frontend-ui/core/badge';

const meta = {
  title: 'Components/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { children: 'Draft', variant: 'default' },
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'secondary',
        'destructive',
        'outline',
        'ghost',
        'link',
      ],
    },
    children: { control: 'text' },
    render: {
      control: false,
      description:
        'Compose a link or button while preserving badge styles and props.',
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Destructive: Story = {
  args: { variant: 'destructive', children: 'Failed' },
};
export const Outline: Story = { args: { variant: 'outline' } };
export const Ghost: Story = { args: { variant: 'ghost' } };
export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Details',
    render: <a href="#badge-details" />,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {(
        [
          'default',
          'secondary',
          'destructive',
          'outline',
          'ghost',
          'link',
        ] as const
      ).map((variant) => (
        <Badge key={variant} variant={variant}>
          {variant}
        </Badge>
      ))}
    </div>
  ),
};

export const LeadingIcon: Story = {
  args: {
    children: (
      <>
        <CheckIcon aria-hidden="true" data-icon="inline-start" />
        Saved
      </>
    ),
  },
};

export const TrailingIcon: Story = {
  args: {
    variant: 'secondary',
    children: (
      <>
        Archived
        <XIcon aria-hidden="true" data-icon="inline-end" />
      </>
    ),
  },
};

export const Counts: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Badge aria-label="No unread items">0</Badge>
      <Badge aria-label="3 unread items">3</Badge>
      <Badge variant="secondary" aria-label="More than 99 unread items">
        99+
      </Badge>
    </div>
  ),
};

export const LongLabel: Story = {
  args: {
    variant: 'outline',
    children: 'Waiting for a collaborator to review this document',
  },
};

export const KeyboardLink: Story = {
  args: {
    variant: 'outline',
    children: 'Document details',
    render: (
      <a href="#badge-details" onClick={(event) => event.preventDefault()} />
    ),
    onClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const link = within(canvasElement).getByRole('link', {
      name: 'Document details',
    });
    await userEvent.tab();
    await expect(link).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onClick).toHaveBeenCalledTimes(1);
    await expect(link).toHaveAttribute('href', '#badge-details');
  },
};

export const ButtonComposition: Story = {
  args: {
    variant: 'secondary',
    children: 'Remove filter',
    render: <button type="button" />,
    onClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('button')).toHaveLength(1);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Remove filter' }),
    );
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};
