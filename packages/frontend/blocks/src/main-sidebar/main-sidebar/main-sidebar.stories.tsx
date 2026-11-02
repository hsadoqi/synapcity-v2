import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { MainSidebarShell } from '../../';

const contexts = [
  { id: 'writing', label: 'Writing', icon: 'pen-line' },
  { id: 'research', label: 'Research', icon: 'search' },
  { id: 'home', label: 'Home', icon: 'house' },
];
const groups = [
  {
    id: 'notes',
    label: 'Notes',
    items: [
      { id: 'brief', label: 'Launch brief', icon: 'file-text' },
      { id: 'notes', label: 'Interview notes', icon: 'notebook' },
    ],
  },
  {
    id: 'views',
    label: 'Views',
    items: [
      { id: 'status', label: 'Project status', icon: 'chart-no-axes-column' },
    ],
  },
];

const meta: Meta<typeof MainSidebarShell> = {
  title: 'Blocks/MainSidebar',
  component: MainSidebarShell,
  parameters: { layout: 'fullscreen' },
  args: {
    railItems: contexts,
    activeRailItemId: contexts[0]!.id,
    railLabel: 'Contexts',
    onSelectRailItem: fn(),
    panelLabel: contexts[0]!.label,
    panelGroups: groups,
    activePanelItemId: groups[0]!.items[0]!.id,
    onSelectPanelItem: fn(),
    children: null,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const activeContext =
      contexts.find(({ id }) => id === args.activeRailItemId) ?? contexts[0]!;
    const activeItem =
      groups
        .flatMap((group) => group.items)
        .find(({ id }) => id === args.activePanelItemId) ??
      groups[0]!.items[0]!;

    return (
      <div className="h-svh p-4">
        <div className="h-full overflow-hidden rounded-lg border">
          <MainSidebarShell {...args} panelLabel={activeContext.label}>
            <div className="p-6">
              <p className="text-muted-foreground text-sm">
                {activeContext.label}
              </p>
              <h1 className="text-xl font-semibold">{activeItem.label}</h1>
            </div>
          </MainSidebarShell>
        </div>
      </div>
    );
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Research' }));
    await expect(args.onSelectRailItem).toHaveBeenCalledWith(contexts[1]);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Project status' }),
    );
    await expect(args.onSelectPanelItem).toHaveBeenCalledWith(
      groups[1]!.items[0],
    );
  },
};
