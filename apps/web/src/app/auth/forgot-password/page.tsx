import type { Metadata } from 'next';

import { ForgotPasswordCard } from '@/components/auth/forgot-password-card';
import { AuthLinkButton } from '@/components/auth/auth-link-button';

export const metadata: Metadata = { title: 'Reset your password' };

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col size-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <ForgotPasswordCard />
      </div>
      <AuthLinkButton type="login" className="mt-4" />
    </div>
  );
}
