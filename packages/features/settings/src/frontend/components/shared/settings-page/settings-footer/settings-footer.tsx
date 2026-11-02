import { Cloud, LockKeyhole } from 'lucide-react';

export const SettingsFooter = ({
  syncsToAccount = false,
}: {
  /**
   * Whether preferences are saved to the account (signed in, and the account's
   * copy was read). Without it everything stays in this browser.
   */
  syncsToAccount?: boolean;
}) => {
  const Icon = syncsToAccount ? Cloud : LockKeyhole;
  return (
    <footer className="flex flex-col items-start gap-2 text-xs text-muted-foreground">
      {/* The icon sits on the first line when the note wraps. */}
      <p className="flex items-start gap-2">
        <Icon className="mt-px size-3.5 shrink-0" />
        {/* Some preferences stay on the device even when signed in (ADR-0010:
            colour mode, density, text size, display), so this never says
            everything follows the account. */}
        {syncsToAccount
          ? 'Most preferences are saved to your account. A few, like text size, stay on this device.'
          : 'Your preferences stay in this browser.'}
      </p>
      <p>Little changes. A space of your own.</p>
    </footer>
  );
};
