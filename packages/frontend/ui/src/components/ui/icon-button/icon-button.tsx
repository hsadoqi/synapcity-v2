'use client';

import {
  Button,
  type ButtonProps,
  type ButtonSize,
} from '@synapcity/frontend-ui/core/button';

type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type IconButtonProps = Omit<ButtonProps, 'size'> & { size?: IconSize };

const iconSizeMap: Record<IconSize, ButtonSize> = {
  xs: 'icon-xs',
  sm: 'icon-sm',
  md: 'icon',
  lg: 'icon-lg',
  xl: 'icon-xl',
};

const IconButton = ({
  className,
  size = 'md',
  variant = 'default',
  ...props
}: IconButtonProps) => {
  const iconSize = size ? iconSizeMap[size] : 'icon';
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
