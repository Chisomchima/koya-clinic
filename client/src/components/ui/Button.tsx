import { motion, type HTMLMotionProps } from 'motion/react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary: 'bg-primary-500 text-white shadow-sm shadow-primary-500/30 hover:bg-primary-700',
  secondary:
    'bg-white text-ink ring-1 ring-line ring-inset hover:ring-primary-500 hover:text-primary-500',
  ghost: 'text-ink hover:bg-primary-50 hover:text-primary-500',
  danger: 'bg-danger text-white shadow-sm shadow-danger/30 hover:brightness-95',
};

const sizes: Record<Size, string> = {
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-13 px-7 text-base',
};

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children?: ReactNode;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  const inactive = disabled || loading;
  return (
    <motion.button
      type={type}
      whileHover={inactive ? undefined : { y: -1 }}
      whileTap={inactive ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      disabled={inactive}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-55',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </motion.button>
  );
}
