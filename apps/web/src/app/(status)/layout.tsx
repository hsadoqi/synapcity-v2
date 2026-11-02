import { PublicShell } from '@synapcity/frontend-shells';

/**
 * Pages that say the service is not answering. They must not ask the Auth
 * service anything (the public shell here has no account menu, unlike the
 * `(auth)` group's header): asking again would wait out another deadline to
 * learn what the proxy just found out.
 */
export default function StatusLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <PublicShell>{children}</PublicShell>;
}
