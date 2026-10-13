import { RootHeader } from './root-header';
import { RootFooter } from './root-footer';
import { RootContent } from './root-content';

export default function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col">
      <RootHeader />
      <RootContent>{children}</RootContent>
      <RootFooter />
    </div>
  );
}
