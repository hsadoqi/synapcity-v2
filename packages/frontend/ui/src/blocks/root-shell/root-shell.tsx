import { cn } from 'cn';
import { buttonVariants } from '../../components/ui/button';
import { RootHeader } from './root-header';
import { RootFooter } from './root-footer';
import { RootContent } from './root-content';

export default function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col">
      <a
        href="#main-content"
        className={cn(
          buttonVariants({ variant: 'secondary' }),
          'fixed top-4 left-4 z-50 -translate-y-24 focus-visible:translate-y-0',
        )}
      >
        Skip to main content
      </a>
      <RootHeader />
      <RootContent>{children}</RootContent>
      <RootFooter />
    </div>
  );
}
