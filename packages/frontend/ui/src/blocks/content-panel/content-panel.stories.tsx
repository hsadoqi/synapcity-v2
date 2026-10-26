import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { ContentPanel } from '@synapcity/frontend-ui/blocks/content-panel';

const meta = {
  title: 'Blocks/ContentPanel',
  component: ContentPanel,
  parameters: { layout: 'centered' },
  args: {
    surface: 'card',
    bordered: false,
    inverted: false,
    componentId: 'Feature177 Content',
    sizeLabel: 'Size',
    headingLabel: 'Heading',
    heading: 'No tutorials needed.',
    descriptionLabel: 'Description',
    description:
      'If you can order food online, you can build a website with Beste.',
  },
} satisfies Meta<typeof ContentPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Surfaces: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      <ContentPanel {...args} />
      <ContentPanel {...args} surface="glass" />
    </div>
  ),
};

export const Inverted: Story = { args: { inverted: true } };

export const Bordered: Story = { args: { bordered: true } };

/** With nothing to edit, the panel is only its header. */
export const HeaderOnly: Story = {
  args: { heading: undefined, description: undefined },
};

export const WithLocale: Story = { args: { locale: '🇪🇸', componentTag: 'H2' } };
