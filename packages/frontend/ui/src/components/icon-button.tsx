'use client';

import { Button } from './ui/button';
import type { ButtonProps, ButtonSize } from './ui/button';

type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type IconButtonProps = Omit<ButtonProps, 'size'> & { size?: IconSize };

const IconButton = ({
  className,
  size,
  variant = 'default',
  ...props
}: IconButtonProps) => {
  const iconSizes: Record<IconSize, ButtonSize> = {
    xs: 'icon-xs',
    sm: 'icon-sm',
    md: 'icon',
    lg: 'icon-lg',
    xl: 'icon-xl',
  };
  const iconSize = size ? iconSizes[size] : 'icon';
  return (
    <Button
      data-slot="icon-button"
      variant={variant}
      size={iconSize}
      className={className}
      {...props}
    />
  );
};

export { IconButton };
export type { IconSize, IconButtonProps };
