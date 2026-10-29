import { requireSignedIn } from '@/lib/access/require-signed-in';

/**
 * Everything in this route group needs a signed-in user. The group adds no URL
 * segment, so `(protected)/[userId]/home` is served at `/<userId>/home`. It
 * adds no shell or provider either: those stay in the root layout, which
 * public and auth pages share.
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSignedIn();

  return children;
}
