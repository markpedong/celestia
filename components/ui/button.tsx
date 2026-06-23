import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { LoaderCircle } from 'lucide-react';
import { Slot } from 'radix-ui';
import { cn } from '@/lib/utils';

const buttonVariants = cva('...', {
  variants: {
    variant: {
      default: '...',
      outline: '...',
      secondary: '...',
      ghost: '...',
      destructive: '...',
      link: '...',
    },
    size: {
      default: '...',
      xs: '...',
      sm: '...',
      lg: '...',
      icon: '...',
      'icon-xs': '...',
      'icon-sm': '...',
      'icon-lg': '...',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

export type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    isLoading?: boolean;
    loadingText?: React.ReactNode;
  };

const Button = ({
  'aria-busy': ariaBusy,
  className,
  children,
  disabled,
  variant = 'default',
  size = 'default',
  asChild = false,
  isLoading = false,
  loadingText,
  ...props
}: ButtonProps) => {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot='button'
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || isLoading}
      aria-busy={isLoading || ariaBusy || undefined}
      {...props}
    >
      {isLoading ? (
        <>
          <LoaderCircle className='size-4 animate-spin' />
          {loadingText ?? children}
        </>
      ) : (
        children
      )}
    </Comp>
  );
};

export { Button, buttonVariants };