import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@synapcity/frontend-ui/core/resizable';

const meta: Meta<typeof ResizablePanelGroup> = {
  title: 'Components/Resizable',
  component: ResizablePanelGroup,
  render: (args) => (
    <div className="h-96 w-80">
      <ResizablePanelGroup {...args}>
        <ResizablePanel defaultSize="40%">
          <p className="p-4">First section</p>
        </ResizablePanel>
        <ResizableHandle aria-label="Resize sections" />
        <ResizablePanel>
          <p className="p-4">Second section</p>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
};
export default meta;
type Story = StoryObj<typeof ResizablePanelGroup>;
export const Horizontal: Story = {};
export const Vertical: Story = {
  args: { orientation: 'vertical' },
  play: async ({ canvasElement }) => {
    const handle = within(canvasElement).getByRole('separator', {
      name: 'Resize sections',
    });
    const before = Number(handle.getAttribute('aria-valuenow'));
    handle.focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(Number(handle.getAttribute('aria-valuenow'))).toBeGreaterThan(
      before,
    );
  },
};
