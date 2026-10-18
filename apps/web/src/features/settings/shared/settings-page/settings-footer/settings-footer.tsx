import { LockKeyhole } from 'lucide-react';

export const SettingsFooter = () => {
  return (
    <footer className="flex flex-col items-start justify-between gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center">
      <p className="flex items-center gap-2">
        <LockKeyhole className="size-3.5" />
        Your preferences stay in this browser.
      </p>
      <p>Little changes. A space of your own.</p>
    </footer>
  );
};
