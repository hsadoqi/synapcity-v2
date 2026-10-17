import type { ReactNode } from 'react';

export function SettingsPageShell({ children }: { children: ReactNode }) {
  return (
    // Fills the screen below the header; only a tab's content scrolls. Every
    // flex box down to the tab card needs min-h-0 to shrink below its content.
    // A div, not <main>: RootContent already renders the page's one <main>.
    <div
      data-fill-viewport
      className="flex min-h-0 flex-1 flex-col bg-background text-foreground"
    >
      <div className="mx-auto flex min-h-0 w-full min-w-0 max-w-7xl flex-1 flex-col px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
