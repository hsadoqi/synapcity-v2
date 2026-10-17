import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { HomeIcon, InboxIcon, SettingsIcon } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from '@synapcity/frontend-ui/core/sidebar';
import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';

const meta: Meta<typeof Sidebar> = {
  title: 'Components/Sidebar',
  component: Sidebar,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <SidebarProvider className="min-h-96">
          <Story />
          <SidebarInset>
            <header className="flex h-12 items-center gap-2 border-b px-4">
              <SidebarTrigger />
              <span className="text-xs">Page</span>
            </header>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

const items = [
  { label: 'Home', icon: HomeIcon, active: true },
  { label: 'Inbox', icon: InboxIcon, badge: '4' },
  { label: 'Settings', icon: SettingsIcon },
];

const Body = () => (
  <>
    <SidebarHeader>Synapcity</SidebarHeader>
    <SidebarSeparator />
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Workspace</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map(({ label, icon: Icon, active, badge }) => (
              <SidebarMenuItem key={label}>
                <SidebarMenuButton isActive={active} tooltip={label}>
                  <Icon aria-hidden />
                  <span>{label}</span>
                </SidebarMenuButton>
                {badge ? <SidebarMenuBadge>{badge}</SidebarMenuBadge> : null}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter>v0</SidebarFooter>
  </>
);

export const Default: Story = {
  render: (args) => (
    <Sidebar {...args}>
      <Body />
      <SidebarRail />
    </Sidebar>
  ),
};

export const IconCollapsible: Story = {
  args: { collapsible: 'icon' },
  render: (args) => (
    <Sidebar {...args}>
      <Body />
    </Sidebar>
  ),
};

export const Floating: Story = {
  args: { variant: 'floating' },
  render: (args) => (
    <Sidebar {...args}>
      <Body />
    </Sidebar>
  ),
};

export const RightSide: Story = {
  args: { side: 'right' },
  render: (args) => (
    <Sidebar {...args}>
      <Body />
    </Sidebar>
  ),
};

export const Loading: Story = {
  render: (args) => (
    <Sidebar {...args}>
      <SidebarContent>
        <SidebarMenu>
          {[1, 2, 3].map((n) => (
            <SidebarMenuItem key={n}>
              <SidebarMenuSkeleton showIcon />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  ),
};
