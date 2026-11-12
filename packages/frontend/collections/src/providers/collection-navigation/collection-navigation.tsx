'use client';

import {
  createContext,
  useContext,
  type AnchorHTMLAttributes,
  type ComponentType,
  type ReactNode,
} from 'react';

/** A link the host supplies, so shared presentation never imports a router. */
export type CollectionLink = ComponentType<
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
>;

/** How a collection opens an item: through a link, or by moving the page. */
export type CollectionNavigation = {
  Link: CollectionLink;
  push(href: string): void;
};

const PlainLink: CollectionLink = ({ href, ...props }) => (
  <a href={href} {...props} />
);

/** Without a host: a plain anchor and a full page load. Stories and tests need no router. */
const plainNavigation: CollectionNavigation = {
  Link: PlainLink,
  //   prefer prefetching; use with dynamic determinaim
  push: (href) => window.location.assign(href),
};

const CollectionNavigationContext =
  createContext<CollectionNavigation>(plainNavigation);

/** The host's links and navigation for every collection component below it. */
export function CollectionNavigationProvider({
  value,
  children,
}: {
  value: CollectionNavigation;
  children: ReactNode;
}) {
  return (
    <CollectionNavigationContext value={value}>
      {children}
    </CollectionNavigationContext>
  );
}

export function useCollectionNavigation(): CollectionNavigation {
  return useContext(CollectionNavigationContext);
}
