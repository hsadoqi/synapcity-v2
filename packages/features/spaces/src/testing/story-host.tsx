import type { Decorator } from '@storybook/nextjs-vite';
import { CollectionNavigationProvider } from '@synapcity/frontend-collection';
import { fn } from 'storybook/test';

/** Story-only. Links and pushes report here instead of leaving the story. */
export const navigate = fn();

/** A stub host: the collection's links and navigation, kept inside the story. */
export const withStubNavigation: Decorator = (Story) => (
  <CollectionNavigationProvider
    value={{
      Link: ({ href, onClick, ...props }) => (
        <a
          href={href}
          onClick={(event) => {
            onClick?.(event);
            event.preventDefault();
            navigate(href);
          }}
          {...props}
        />
      ),
      push: navigate,
    }}
  >
    <Story />
  </CollectionNavigationProvider>
);
