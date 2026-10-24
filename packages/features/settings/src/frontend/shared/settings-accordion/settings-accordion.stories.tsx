import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { SettingsAccordion, SettingsAccordionItem } from './settings-accordion';

const meta = {
  title: 'Features/Settings/Settings accordion',
  component: SettingsAccordion,
} satisfies Meta<typeof SettingsAccordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Sections: Story = {
  args: { children: null },
  render: () => (
    <SettingsAccordion>
      <SettingsAccordionItem value="appearance" title="Appearance">
        <p>Choose how the workspace looks.</p>
      </SettingsAccordionItem>
      <SettingsAccordionItem value="motion" title="Motion">
        <p>Choose how transitions behave.</p>
      </SettingsAccordionItem>
    </SettingsAccordion>
  ),
};
