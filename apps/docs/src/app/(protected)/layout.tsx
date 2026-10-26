import { RootShell } from '@synapcity/frontend-shells';
import RootProviders from '../providers';

export default function RootDocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RootProviders>
      <RootShell>{children}</RootShell>
    </RootProviders>
  );
}
