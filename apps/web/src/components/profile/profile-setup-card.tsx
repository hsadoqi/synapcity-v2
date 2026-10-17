'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@synapcity/frontend-ui/core/button';

import { ProfileSetupForm } from '@/features/account/components/profile/profile-setup-form';
import { skipProfileSetup } from '@/features/account/server/actions/setup-actions';
import { AuthShell } from '@/features/auth/shared/auth-shell';

/**
 * The step after a sign-up: confirm the name and photo, or skip. It composes
 * account's form inside auth's card because it belongs to neither feature; the
 * app decides where to go next (ADR-0009), and `next` was validated by the
 * page that rendered this.
 */
export function ProfileSetupCard({
  defaultName,
  imageUrl,
  next,
}: {
  defaultName: string;
  imageUrl: string | null;
  next: string;
}) {
  const router = useRouter();
  const [skipping, startSkip] = useTransition();
  const goOn = () => router.push(next);

  return (
    <AuthShell
      title="Welcome"
      description="Check how your name and photo will appear. You can change them any time in settings."
      footer={
        <Button
          type="button"
          variant="link"
          disabled={skipping}
          aria-busy={skipping}
          onClick={() =>
            startSkip(async () => {
              // Carry on whether or not this saved, even if the request itself
              // failed: at worst the step is offered once more at the next
              // sign-in, and nobody is held on a page they chose to leave.
              try {
                await skipProfileSetup();
              } catch {
                // Nothing to tell them: they asked to skip, and they will.
              }
              goOn();
            })
          }
        >
          {skipping ? 'Skipping…' : 'Skip for now'}
        </Button>
      }
    >
      <ProfileSetupForm
        defaultName={defaultName}
        imageUrl={imageUrl}
        onComplete={goOn}
      />
    </AuthShell>
  );
}
