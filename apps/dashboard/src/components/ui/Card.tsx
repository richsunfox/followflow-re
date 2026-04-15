import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Lift on hover — adds translateY(-2px) + deeper shadow */
  hoverable?: boolean;
  /** Remove default 24px padding */
  noPad?: boolean;
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { hoverable = false, noPad = false, className, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'bg-ao-surface border border-ao-border rounded-2xl',
        'shadow-card',
        !noPad && 'p-6',
        hoverable && [
          'transition-all duration-150 ease-out cursor-pointer',
          'hover:-translate-y-0.5 hover:shadow-card-hover hover:border-ao-blue/20',
        ].join(' '),
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

// ─── CardHeader ───────────────────────────────────────────────────────────────

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title:     string;
  subtitle?: string;
  action?:   React.ReactNode;
}

export function CardHeader({ title, subtitle, action, className, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn('flex items-start justify-between gap-4 pb-4 border-b border-ao-border', className)}
      {...props}
    >
      <div>
        <h3 className="text-white font-semibold text-base">{title}</h3>
        {subtitle && <p className="text-ao-muted text-sm mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ─── Light Card (for use on #F7F8FC backgrounds) ──────────────────────────────

export const LightCard = forwardRef<HTMLDivElement, CardProps>(function LightCard(
  { hoverable = false, noPad = false, className, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'bg-white border border-[#E2E8F0] rounded-2xl shadow-card',
        !noPad && 'p-6',
        hoverable && 'transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-card-hover',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});

LightCard.displayName = 'LightCard';
