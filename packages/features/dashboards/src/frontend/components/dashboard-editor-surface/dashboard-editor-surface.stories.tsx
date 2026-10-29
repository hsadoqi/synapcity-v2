import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { createComposition } from '@synapcity/domain-dashboards';
import { expect, userEvent, within } from 'storybook/test';

import { withDashboardStore } from '../../../testing';
import { DashboardWidgetsDestination } from '../dashboard-widgets-destination';
import { DashboardEditorSurface } from './index';

const meta: Meta<typeof DashboardEditorSurface> = {
    title: 'Dashboards/EditorSurface',
    component: DashboardEditorSurface,
    parameters: { layout: 'fullscreen' },
    decorators: [
        (Story) => (
            <div className="flex h-screen flex-col">
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof DashboardEditorSurface>;

/** The canvas and its toolbar alone: the palette belongs to the host. */
export const Default: Story = { decorators: [withDashboardStore()] };

export const Empty: Story = {
    decorators: [withDashboardStore({ composition: createComposition() })],
};

/**
 * A host with its own place for the palette, as a panel destination is: the
 * surface asks for it with `onOpenPalette`, and the host's column shows it.
 */
export const WithHostPalette: Story = {
    // The first decorator is the innermost: the layout (which holds the host's
    // palette) must sit inside the store.
    decorators: [
        (Story) => (
            <div className="flex min-h-0 flex-1">
                <div className="flex min-w-0 flex-1 flex-col">
                    <Story />
                </div>
                <div className="w-80 shrink-0 overflow-auto border-l border-border">
                    <DashboardWidgetsDestination />
                </div>
            </div>
        ),
        withDashboardStore(),
    ],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(
            canvas.getAllByRole('button', { name: 'Edit layout' })[0]!,
        );
        await expect(
            canvas.getByRole('region', { name: 'Add to dashboard' }),
        ).toBeVisible();
    },
};
