import { AuthPageShell } from '@/components/shells';
import { createMetadata } from '@synapcity/frontend-site/metadata';
import { Metadata } from 'next';

export const metadata: Metadata = createMetadata({
  title: 'Synapcity - Sign In/Sign Up',
  description: 'A connected workspace for thinking, planning, and doing.',
  siteUrl: process.env.SITE_URL,
});

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AuthPageShell>{children}</AuthPageShell>;
}
