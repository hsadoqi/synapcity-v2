'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import { useView } from '@/components/view-provider';
import { VIEWS, VIEW_META, type View } from '@/lib/view';

const LINKS = [
  { href: '/', label: 'Runs' },
  { href: '/today', label: 'Today' },
  { href: '/history', label: 'History' },
  { href: '/builder', label: 'Build' },
] as const;

function ViewSwitcher({ className }: { className?: string }) {
  const { view, setView } = useView();
  return (
    <div
      role="group"
      aria-label="Layout"
      className={cn(
        'inline-flex items-center rounded-md border p-0.5',
        className,
      )}
    >
      {VIEWS.map((v: View) => (
        <button
          key={v}
          type="button"
          aria-pressed={view === v}
          title={VIEW_META[v].description}
          onClick={() => setView(v)}
          className={cn(
            'min-h-9 rounded-sm px-3 text-sm transition-colors',
            view === v
              ? 'bg-primary font-medium text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {VIEW_META[v].label}
        </button>
      ))}
    </div>
  );
}

function SiteNav() {
  const pathname = usePathname();
  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-[1100px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-[0.9375rem] font-semibold"
        >
          <span aria-hidden="true" className="size-5 rounded-sm bg-primary" />
          Runs
        </Link>
        <nav aria-label="Main" className="flex flex-1 flex-wrap gap-1">
          {LINKS.map((link) => {
            const active =
              link.href === '/'
                ? pathname === '/'
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center rounded-sm px-3 text-sm transition-colors hover:text-foreground',
                  active
                    ? 'font-medium text-foreground underline decoration-primary decoration-2 underline-offset-8'
                    : 'text-muted-foreground',
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <ViewSwitcher />
      </div>
    </header>
  );
}

export function PageFrame({
  children,
  width = 'max-w-[900px]',
}: {
  children: React.ReactNode;
  width?: string;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteNav />
      <main
        className={cn(
          'mx-auto flex w-full flex-1 flex-col gap-9 px-4 py-10 sm:px-8 sm:py-14',
          width,
        )}
      >
        {children}
      </main>
    </div>
  );
}
