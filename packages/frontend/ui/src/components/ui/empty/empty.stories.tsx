import { useState, type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FileIcon, FolderIcon, SearchIcon } from 'lucide-react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { Button } from '@synapcity/frontend-ui/core/button';
import { LinkButton } from '@synapcity/frontend-ui/components/link-button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@synapcity/frontend-ui/core/empty';

const meta = {
  title: 'Components/Empty',
  component: Empty,
  subcomponents: {
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
    EmptyDescription,
    EmptyContent,
  },
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: { children: { control: false } },
  render: (args) => <Example {...args} />,
} satisfies Meta<typeof Empty>;

export default meta;
type Story = StoryObj<typeof meta>;

function Example(props: ComponentProps<typeof Empty>) {
  return (
    <Empty {...props}>
      <EmptyHeader>
        <EmptyTitle>No documents yet</EmptyTitle>
        <EmptyDescription>
          Your documents will appear here once you create one.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export const Default: Story = {};

export const WithIcon: Story = {
  render: (args) => (
    <Empty {...args}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FolderIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>This folder is empty</EmptyTitle>
        <EmptyDescription>
          Add a document to start organizing your work.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  ),
};

export const DefaultMedia: Story = {
  render: (args) => (
    <Empty {...args}>
      <EmptyHeader>
        <EmptyMedia>
          <FileIcon className="size-12" aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>No documents yet</EmptyTitle>
        <EmptyDescription>
          Default media leaves the illustration without an icon tile.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  ),
};

export const WithAction: Story = {
  render: (args) => (
    <Empty {...args}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>No documents yet</EmptyTitle>
        <EmptyDescription>
          Create your first document to get started.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={fn()}>Create document</Button>
      </EmptyContent>
    </Empty>
  ),
};

export const WithDescriptionLink: Story = {
  render: (args) => (
    <Empty {...args}>
      <EmptyHeader>
        <EmptyTitle>Need a starting point?</EmptyTitle>
        <EmptyDescription>
          Create a document or{' '}
          <a href="#empty-guide">read the getting started guide</a>.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  ),
};

export const Bordered: Story = { args: { className: 'border' } };

export const Compact: Story = {
  decorators: [
    (Story) => (
      <div className="mx-auto w-full max-w-xs">
        <Story />
      </div>
    ),
  ],
  args: { className: 'border p-4' },
};

export const LongContent: Story = {
  decorators: [
    (Story) => (
      <div className="mx-auto w-full max-w-xs">
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <Empty {...args}>
      <EmptyHeader>
        <EmptyTitle>
          No documents match the current combination of filters
        </EmptyTitle>
        <EmptyDescription>
          Try removing a filter or searching for a shorter phrase. Documents
          that match your new search will appear here so you can pick up where
          you left off.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline">Clear all filters</Button>
      </EmptyContent>
    </Empty>
  ),
};

export const TitleOnly: Story = {
  render: (args) => (
    <Empty {...args}>
      <EmptyHeader>
        <EmptyTitle>Nothing here yet</EmptyTitle>
      </EmptyHeader>
    </Empty>
  ),
};

function SearchExample(props: ComponentProps<typeof Empty>) {
  const [cleared, setCleared] = useState(false);
  if (cleared)
    return <p role="status">Filters cleared. Showing all documents.</p>;
  return (
    <Empty {...props}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>No matching documents</EmptyTitle>
        <EmptyDescription>
          Try a different search or clear your filters.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center">
        <Button onClick={() => setCleared(true)}>Clear filters</Button>
        <LinkButton variant="outline" href="#search-help">
          Search help
        </LinkButton>
      </EmptyContent>
    </Empty>
  );
}

/** Local story state demonstrates the action; it does not query application data. */
export const NoSearchResults: Story = {
  render: (args) => <SearchExample {...args} />,
};

export const ClearsFiltersWithKeyboard: Story = {
  render: (args) => <SearchExample {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const clear = canvas.getByRole('button', { name: 'Clear filters' });
    await userEvent.tab();
    await expect(clear).toHaveFocus();
    await userEvent.tab();
    await expect(
      canvas.getByRole('link', { name: 'Search help' }),
    ).toHaveFocus();
    await userEvent.tab({ shift: true });
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Filters cleared. Showing all documents.',
    );
    await expect(
      canvas.queryByText('No matching documents'),
    ).not.toBeInTheDocument();
  },
};
