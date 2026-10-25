import { AuthShell } from '../../../auth-shell';
import { UpdatePasswordForm } from './update-password-form';
import type { AuthAction } from '../../../../contracts';

export function UpdatePasswordCard({
  next,
  updatePassword,
}: {
  next: string;
  updatePassword: AuthAction;
}) {
  return (
    <AuthShell title="Choose a new password">
      <UpdatePasswordForm updatePassword={updatePassword} next={next} />
    </AuthShell>
  );
}
