'use client';

import { Button } from '@synapcity/frontend-ui/core/button';

import { FormField } from '@/components/forms/form-field';
import { fieldErrorProps } from '@/components/forms/form-feedback';
import { isUploadedAvatar } from '@/features/account/shared/avatar-url';
import { AVATAR_ACCEPT, MAX_AVATAR_BYTES } from '@/features/account/types';
import { ProfileAvatar } from '@/features/account/shared/profile-avatar';
import { useProfileForm } from '../profile/profile-form-shell';

const MAX_MB = MAX_AVATAR_BYTES / 1024 / 1024;

/**
 * The photo input with a preview. Place it inside a `ProfileFormShell`. An
 * uploaded photo can be dropped for the default one: the picture the person's
 * Google or GitHub account supplied, or the person icon when there is none.
 */
export function AvatarField({
  name,
  imageUrl,
  canRemove = true,
  autoFocus,
}: {
  name: string | null;
  imageUrl: string | null;
  canRemove?: boolean;
  autoFocus?: boolean;
}) {
  const { state, messageId, pending } = useProfileForm();
  const shown = state.avatarUrl === undefined ? imageUrl : state.avatarUrl;

  return (
    <div className="flex flex-col gap-4">
      <ProfileAvatar
        name={name}
        imageUrl={shown}
        size="lg"
        className="size-16"
      />
      <FormField
        id="avatar"
        {...fieldErrorProps(state, 'avatar', messageId)}
        label="Photo"
        hint={`PNG, JPEG or WebP, up to ${MAX_MB} MB.`}
        type="file"
        accept={AVATAR_ACCEPT}
        autoFocus={autoFocus}
      />
      {canRemove && isUploadedAvatar(shown) && (
        <div>
          <Button
            type="submit"
            name="intent"
            value="remove"
            variant="outline"
            disabled={pending}
          >
            Use default photo
          </Button>
        </div>
      )}
    </div>
  );
}
