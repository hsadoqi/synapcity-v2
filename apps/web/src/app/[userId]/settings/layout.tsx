import { SettingsPageShell } from '@/features/settings/shared';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SettingsPageShell>{children}</SettingsPageShell>;
}
