'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'premium';
export type ButtonSize    = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?:    ButtonSize;
  loading?: boolean;
  icon?:    React.ReactNode;
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-ao-blue text-white',
    'hover:bg-ao-blue-hover',
    'shadow-blue hover:shadow-blue-lg',
    'active:scale-[0.98]',
  ].join(' '),

  secondary: [
    'bg-transparent text-white',
    'border border-ao-border',
    'hover:border-ao-blue/50 hover:bg-ao-blue/5',
    'active:scale-[0.98]',
  ].join(' '),

  ghost: [
    'bg-transparent text-ao-muted',
    'hover:text-white hover:bg-white/[0.06]',
    'active:scale-[0.98]',
  ].join(' '),

  premium: [
    'bg-ao-gold text-ao-navy font-semibold',
    'hover:brightness-110',
    'active:scale-[0.98]',
  ].join(' '),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8  px-3   text-sm  gap-1.5 rounded-lg',
  md: 'h-10 px-4   text-sm  gap-2   rounded-lg',
  lg: 'h-12 px-6   text-base gap-2.5 rounded-xl',
};

// ─── Component ────────────────────────────────────────────────────────────────

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size    = 'md',
    loading = false,
    icon,
    children,
    className,
    disabled,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        // Base
        'inline-flex items-center justify-center font-medium',
        'transition-all duration-150 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ao-blue focus-visible:ring-offset-2 focus-visible:ring-offset-ao-navy',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        // Variant + size
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <>
          <Spinner />
          {children && <span>{children}</span>}
        </>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          {children && <span>{children}</span>}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
