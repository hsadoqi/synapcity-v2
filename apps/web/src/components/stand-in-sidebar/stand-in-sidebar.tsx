import type { RootSidebarContent } from '@synapcity/frontend-shells';
import { ContextSwitcher, SearchForm } from '@synapcity/frontend-shells';

// Stand-in until the frontend-shells plan's Task 6 gives the signed-in sidebar
// its real sections (core links, then the active context's sections). This is
// the shadcn documentation template the sidebar has shown so far, now passed in
// by the app instead of hard-wired in the shell, so the move changes nothing
// a user sees. Delete it in Task 6.
const versions = ['1.0.1', '1.1.0-alpha', '2.0.0-beta1'];

export const STAND_IN_SIDEBAR: RootSidebarContent = {
  header: (
    <>
      <ContextSwitcher versions={versions} defaultVersion={versions[0]!} />
      <SearchForm />
    </>
  ),
  groups: [
    {
      title: 'Getting Started',
      items: [
        {
          title: 'Installation',
          href: '#',
        },
        {
          title: 'Project Structure',
          href: '#',
        },
      ],
    },
    {
      title: 'Build Your Application',
      items: [
        {
          title: 'Routing',
          href: '#',
        },
        {
          title: 'Data Fetching',
          href: '#',
          isActive: true,
        },
        {
          title: 'Rendering',
          href: '#',
        },
        {
          title: 'Caching',
          href: '#',
        },
        {
          title: 'Styling',
          href: '#',
        },
        {
          title: 'Optimizing',
          href: '#',
        },
        {
          title: 'Configuring',
          href: '#',
        },
        {
          title: 'Testing',
          href: '#',
        },
        {
          title: 'Authentication',
          href: '#',
        },
        {
          title: 'Deploying',
          href: '#',
        },
        {
          title: 'Upgrading',
          href: '#',
        },
        {
          title: 'Examples',
          href: '#',
        },
      ],
    },
    {
      title: 'API Reference',
      items: [
        {
          title: 'Components',
          href: '#',
        },
        {
          title: 'File Conventions',
          href: '#',
        },
        {
          title: 'Functions',
          href: '#',
        },
        {
          title: 'next.config.js Options',
          href: '#',
        },
        {
          title: 'CLI',
          href: '#',
        },
        {
          title: 'Edge Runtime',
          href: '#',
        },
      ],
    },
    {
      title: 'Architecture',
      items: [
        {
          title: 'Accessibility',
          href: '#',
        },
        {
          title: 'Fast Refresh',
          href: '#',
        },
        {
          title: 'Next.js Compiler',
          href: '#',
        },
        {
          title: 'Supported Browsers',
          href: '#',
        },
        {
          title: 'Turbopack',
          href: '#',
        },
      ],
    },
  ],
};
