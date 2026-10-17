import { AuthShell } from '../shell/auth-shell';
import { UpdatePasswordForm } from './update-password-form';

export function UpdatePasswordCard() {
  return (
    <AuthShell
      title="Choose a password"
      description="Enter the password you want to use below. You stay signed in after saving it."
    >
      <UpdatePasswordForm />
    </AuthShell>
  );
}
