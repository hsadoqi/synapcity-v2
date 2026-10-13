import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@synapcity/frontend-ui/core/card';
import { UpdatePasswordForm } from './update-password-form';

export function UpdatePasswordCard({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="font-medium text-lg tracking-normal">
            Choose a Password
          </CardTitle>
          <CardDescription>
            Enter the password you want to use below. You stay signed in after
            saving it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UpdatePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
