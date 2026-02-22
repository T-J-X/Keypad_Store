import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { Slot } from 'radix-ui';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-btn text-sm font-medium ring-offset-white transition-[color,background-color,border-color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] gap-2',
  {
    variants: {
      variant: {
        default: 'bg-ink text-white hover:bg-ink/90 hover:shadow-lg hover:shadow-ink/20',
        destructive: 'bg-red-500 text-white hover:bg-red-600',
        outline: 'border border-surface-border bg-white hover:bg-surface-alt hover:text-ink hover:border-ink/20',
        secondary: 'bg-surface-alt text-ink hover:bg-surface-border',
        ghost: 'hover:bg-surface-alt hover:text-ink',
        link: 'text-sky underline-offset-4 hover:underline',
        soft: 'bg-sky-500/10 text-sky-600 hover:bg-sky-500/20',
        premium:
          'border border-transparent text-white bg-[linear-gradient(90deg,#040F2E_0%,#112B5D_55%,#29457A_100%),linear-gradient(90deg,#203f7a_0%,#2f5da8_55%,#4b7fca_100%)] [background-origin:padding-box,border-box] [background-clip:padding-box,border-box] shadow-[0_1px_2px_rgba(0,0,0,0.1)] hover:-translate-y-[1px] hover:bg-[linear-gradient(270deg,#040F2E_0%,#112B5D_55%,#29457A_100%),linear-gradient(90deg,#24497d_0%,#39629a_55%,#537bb0_100%)] hover:shadow-[0_0_0_1px_rgba(72,116,194,0.56),0_10px_24px_rgba(4,15,46,0.29)] disabled:opacity-50 disabled:shadow-none',
        secondaryDark: 'border border-white/15 bg-transparent text-white hover:bg-white/5 hover:text-white hover:border-white/30',
      },
      size: {
        default: 'h-11 px-6 py-3',
        sm: 'h-9 rounded-btn px-3',
        lg: 'h-12 rounded-xl px-8 text-base',
        icon: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = loading || disabled;

  if (asChild) {
    return (
      <Slot.Root
        data-slot="button"
        data-variant={variant}
        data-size={size}
        data-loading={loading ? 'true' : undefined}
        className={cn(buttonVariants({ variant, size, className }))}
        aria-disabled={isDisabled || undefined}
        {...props}
      >
        {children}
      </Slot.Root>
    );
  }

  return (
    <button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={isDisabled}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

export { Button, buttonVariants };
