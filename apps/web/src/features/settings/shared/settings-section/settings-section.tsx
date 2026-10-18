import { useId, type ReactNode } from 'react';

type SettingsSectionProps = {
  title: string;
  children: ReactNode;
};

/**
 * A titled group of rows inside a settings tab. The tab title is the h2, so the
 * section is an h3: set in the heading face and heavier than the row labels,
 * so the groups read before the rows inside them.
 */
export function SettingsSection({ title, children }: SettingsSectionProps) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h3 id={headingId} className="font-heading text-base font-semibold">
        {title}
      </h3>
      {children}
    </section>
  );
}
