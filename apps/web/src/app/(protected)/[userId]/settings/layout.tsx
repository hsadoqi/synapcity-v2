import { SettingsPageShell } from '@synapcity/features-settings/frontend';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SettingsPageShell>{children}</SettingsPageShell>;
}
