import { AuthPageShell } from '@/components/shells';

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AuthPageShell>{children}</AuthPageShell>;
}
