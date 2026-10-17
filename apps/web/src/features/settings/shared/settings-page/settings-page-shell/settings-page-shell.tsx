import type { ReactNode } from 'react';

export function SettingsPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-background text-foreground">
      <div className="flex min-w-0 flex-1 flex-col mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
