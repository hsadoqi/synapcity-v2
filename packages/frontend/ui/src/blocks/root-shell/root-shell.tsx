import { SkipLinkButton } from '../../components/skip-link';
import { RootHeader } from './root-header';
import { RootFooter } from './root-footer';
import { RootContent } from './root-content';

export default function RootShell({
  children,
  headerActions,
  userId,
}: {
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  userId?: string | null;
}) {
  return (
    <div className="flex-1 flex flex-col">
      <SkipLinkButton />
      <RootHeader userId={userId} actions={headerActions} />
      <RootContent>{children}</RootContent>
      <RootFooter />
    </div>
  );
}
