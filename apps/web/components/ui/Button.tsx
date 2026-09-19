import { forwardRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-button font-semibold transition-colors ' +
  'focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60';

const variants: Record<Variant, string> = {
  primary: 'bg-forest text-white hover:bg-forest-hover',
  secondary: 'border border-border bg-surface text-ink hover:bg-warm',
  danger: 'bg-danger text-white hover:brightness-95',
  ghost: 'text-ink hover:bg-warm',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-small',
  md: 'h-11 px-5 text-body',
  lg: 'h-12 px-6 text-body-lg',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
}

export interface ButtonProps extends CommonProps, React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className, ...props },
  ref,
) {
  return (
    <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props} />
  );
});

export interface ButtonLinkProps
  extends CommonProps, Omit<React.ComponentProps<typeof Link>, 'className'> {}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonLinkProps) {
  return <Link className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}
