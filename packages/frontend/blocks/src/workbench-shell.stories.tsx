import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import {
  demoContent,
  demoResourceId,
  demoWorkspaceId,
  demoWorkspaces,
} from '@synapcity/dev-fixtures/scenarios';
import { Badge } from '@synapcity/frontend-ui/core/badge';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@synapcity/frontend-ui/core/card';
import { WorkbenchShell } from './workbench-shell';

/*
 * The shell only lists workspaces and their resources and says which one is
 * selected; the resource view is the story's. The data is the scenario that
 * `pnpm db:seed-demo` puts in the local database.
 */
const workspaces = demoWorkspaces();

function DemoResourceView({ id }: { id: string }) {
  const content = demoContent(id);
  return (
    <article className="flex max-w-3xl flex-col gap-3">
      <h1 className="text-xl font-semibold break-words">{content.name}</h1>
      <div className="flex flex-wrap items-center gap-1 text-xs">
        {content.tags.map((tag) => (
          <Badge key={tag} variant="outline">
            {tag}
          </Badge>
        ))}
        {content.alsoIn.length > 1 ? (
          <span className="text-muted-foreground">
            Filed in {content.alsoIn.join(', ')}
          </span>
        ) : null}
      </div>
      {content.paragraphs?.map((text) => (
        <p key={text} className="text-sm leading-relaxed">
          {text}
        </p>
      ))}
      {content.widgets ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {content.widgets.map((widget) => (
            <Card key={widget.id} size="sm">
              <CardHeader>
                <CardTitle className="truncate">{widget.title}</CardTitle>
                <CardDescription>{widget.type}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : null}
    </article>
  );
}

const shared = workspaces
  .flatMap((w) => w.resources)
  .find((r) => r.alsoIn > 0)!;

const meta: Meta<typeof WorkbenchShell> = {
  title: 'Blocks/WorkbenchShell',
  component: WorkbenchShell,
  parameters: { layout: 'fullscreen' },
  args: {
    workspaces,
    defaultOpen: true,
    initialWorkspaceId: demoWorkspaceId(workspaces, 'Writing'),
    renderResource: ({ resource }) => <DemoResourceView id={resource.id} />,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Writing is the dense space: 15 documents and 4 dashboards, so the panel scrolls. */
export const Default: Story = {};

export const DenseSpace: Story = {
  args: { initialWorkspaceId: demoWorkspaceId(workspaces, 'Product launch') },
};

export const ModerateSpace: Story = {
  args: { initialWorkspaceId: demoWorkspaceId(workspaces, 'Research') },
};

export const LightSpace: Story = {
  args: { initialWorkspaceId: demoWorkspaceId(workspaces, 'Health') },
};

export const EmptySpace: Story = {
  args: { initialWorkspaceId: demoWorkspaceId(workspaces, 'Home') },
};

/** A record filed in more than one space. */
export const SharedRecord: Story = {
  args: {
    initialWorkspaceId: workspaces.find((w) =>
      w.resources.some((r) => r.id === shared.id),
    )!.id,
    initialResourceId: shared.id,
  },
};

export const LongTitle: Story = {
  args: {
    initialWorkspaceId: demoWorkspaceId(workspaces, 'Product launch'),
    initialResourceId: demoResourceId(
      workspaces,
      'Q4 customer interview synthesis and follow-up questions for the pricing experiment',
    ),
  },
};

export const Dashboard: Story = {
  args: {
    initialWorkspaceId: demoWorkspaceId(workspaces, 'Product launch'),
    initialResourceId: demoResourceId(workspaces, 'Launch readiness'),
  },
};

/** Rail only: the panel starts closed and opens when a space is chosen. */
export const CollapsedSidebar: Story = {
  args: { defaultOpen: false },
};

export const Narrow: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
};

export const Wide: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false } },
};

/** Click through: switch space, pick a document, switch away and back. */
export const SwitchingSpaces: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const header = canvasElement.querySelector('header')!;

    await userEvent.click(canvas.getByRole('button', { name: 'Research' }));
    await expect(
      within(header).getByRole('link', { name: 'Research' }),
    ).toBeInTheDocument();

    await userEvent.click(
      canvas.getByRole('button', { name: 'Open questions' }),
    );
    await expect(
      within(header).getByText('Open questions'),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole('heading', { name: 'Open questions' }),
    ).toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: 'Health' }));
    await expect(
      within(header).queryByText('Open questions'),
    ).not.toBeInTheDocument();

    // Back in Research, the earlier choice is still the one shown.
    await userEvent.click(canvas.getByRole('button', { name: 'Research' }));
    await expect(
      canvas.getByRole('heading', { name: 'Open questions' }),
    ).toBeInTheDocument();

    // An empty space says so.
    await userEvent.click(canvas.getByRole('button', { name: 'Home' }));
    await expect(canvas.getByText('Home is empty')).toBeInTheDocument();
  },
};
