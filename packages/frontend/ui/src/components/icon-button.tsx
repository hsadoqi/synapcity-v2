'use client';

import { cn } from 'cn';
import { Button, buttonVariants } from './ui/button';
import type { ButtonProps, ButtonSize } from './ui/button';

type IconSize = 'xs' | 'sm' | 'default' | 'lg' | 'xl';

type IconButtonProps = Omit<ButtonProps, 'size'> & { size?: IconSize };

const IconButton = ({ className, size, ...props }: IconButtonProps) => {
  const iconSizes: Record<IconSize, ButtonSize> = {
    xs: 'icon-xs',
    sm: 'icon-sm',
    default: 'icon',
    lg: 'icon-lg',
    xl: 'icon-xl',
  };
  const iconSize = size ? iconSizes[size] : 'icon';
  return (
    <Button
      data-slot="icon-button"
      className={cn(buttonVariants({ size: iconSize, className }))}
      {...props}
    />
  );
};

export { IconButton };
export type { IconSize, IconButtonProps };
