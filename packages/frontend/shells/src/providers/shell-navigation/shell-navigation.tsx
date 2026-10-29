'use client';

import {
  createContext,
  useContext,
  type AnchorHTMLAttributes,
  type ComponentType,
  type ReactNode,
  type Ref,
} from 'react';

type ShellLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  ref?: Ref<HTMLAnchorElement>;
};

/** A link the host supplies, so the shells never import a router. */
export type ShellLinkComponent = ComponentType<ShellLinkProps>;

/** How the shells link: the host's link component. */
export type ShellNavigation = { Link: ShellLinkComponent };

const PlainLink: ShellLinkComponent = ({ href, ...props }) => (
  <a href={href} {...props} />
);

/** Without a host: a plain anchor. Stories and tests need no router. */
const plainNavigation: ShellNavigation = { Link: PlainLink };

const ShellNavigationContext = createContext<ShellNavigation>(plainNavigation);

/** The host's link for every shell link below it. Mounted once by the app. */
export function ShellNavigationProvider({
  value,
  children,
}: {
  value: ShellNavigation;
  children: ReactNode;
}) {
  return (
    <ShellNavigationContext value={value}>{children}</ShellNavigationContext>
  );
}

/**
 * A link inside a shell. Renders the host's link component, or a plain anchor
 * when no host provider is mounted. A client leaf, so a shell rendered from a
 * server layout stays a server component.
 */
export function ShellLink(props: ShellLinkProps) {
  const { Link } = useContext(ShellNavigationContext);
  return <Link {...props} />;
}
