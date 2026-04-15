import { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

// ─── Lead status badge ─────────────────────────────────────────────────────────

export type LeadStatus =
  | 'new'
  | 'hot'
  | 'warm'
  | 'nurturing'
  | 'contacted'
  | 'cold'
  | 'converted'
  | 'dead'
  | 'paused';

const statusConfig: Record<
  LeadStatus,
  { label: string; classes: string; dot: string }
> = {
  new:       { label: 'New',       classes: 'bg-ao-blue/10   text-ao-blue   border-ao-blue/20',   dot: 'bg-ao-blue'   },
  hot:       { label: 'Hot',       classes: 'bg-red-500/10   text-red-400   border-red-500/20',   dot: 'bg-red-400'   },
  warm:      { label: 'Warm',      classes: 'bg-orange-500/10 text-orange-400 border-orange-500/20', dot: 'bg-orange-400' },
  nurturing: { label: 'Nurturing', classes: 'bg-violet-500/10 text-violet-400 border-violet-500/20', dot: 'bg-violet-400' },
  contacted: { label: 'Contacted', classes: 'bg-sky-500/10   text-sky-400   border-sky-500/20',   dot: 'bg-sky-400'   },
  cold:      { label: 'Cold',      classes: 'bg-white/5      text-ao-muted  border-white/10',     dot: 'bg-ao-muted'  },
  converted: { label: 'Converted', classes: 'bg-green-500/10 text-green-400 border-green-500/20', dot: 'bg-green-400' },
  dead:      { label: 'Dead',      classes: 'bg-white/5      text-ao-muted  border-white/10',     dot: 'bg-ao-muted'  },
  paused:    { label: 'Paused',    classes: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-400' },
};

interface StatusBadgeProps {
  status: LeadStatus;
  showDot?: boolean;
  className?: string;
}

export function StatusBadge({ status, showDot = true, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.cold;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full',
        'text-xs font-medium border',
        config.classes,
        className,
      )}
    >
      {showDot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dot)} />}
      {config.label}
    </span>
  );
}

// ── Light-mode variant (for white card backgrounds) ────────────────────────────

const statusConfigLight: Record<
  LeadStatus,
  { label: string; classes: string; dot: string }
> = {
  new:       { label: 'New',       classes: 'bg-blue-50   text-blue-700   border-blue-200',   dot: 'bg-blue-500'   },
  hot:       { label: 'Hot',       classes: 'bg-red-50    text-red-700    border-red-200',    dot: 'bg-red-500'    },
  warm:      { label: 'Warm',      classes: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  nurturing: { label: 'Nurturing', classes: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
  contacted: { label: 'Contacted', classes: 'bg-sky-50    text-sky-700    border-sky-200',    dot: 'bg-sky-500'    },
  cold:      { label: 'Cold',      classes: 'bg-slate-100 text-slate-600  border-slate-200',  dot: 'bg-slate-400'  },
  converted: { label: 'Converted', classes: 'bg-green-50  text-green-700  border-green-200',  dot: 'bg-green-500'  },
  dead:      { label: 'Dead',      classes: 'bg-slate-100 text-slate-600  border-slate-200',  dot: 'bg-slate-400'  },
  paused:    { label: 'Paused',    classes: 'bg-amber-50  text-amber-700  border-amber-200',  dot: 'bg-amber-500'  },
};

export function StatusBadgeLight({ status, showDot = true, className }: StatusBadgeProps) {
  const config = statusConfigLight[status] ?? statusConfigLight.cold;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full',
        'text-xs font-medium border',
        config.classes,
        className,
      )}
    >
      {showDot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dot)} />}
      {config.label}
    </span>
  );
}

// ── General-purpose Badge ──────────────────────────────────────────────────────

type BadgeColor = 'blue' | 'green' | 'amber' | 'red' | 'gold' | 'muted';

const badgeColors: Record<BadgeColor, string> = {
  blue:  'bg-ao-blue/10  text-ao-blue  border-ao-blue/20',
  green: 'bg-green-500/10 text-green-400 border-green-500/20',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  red:   'bg-red-500/10   text-red-400   border-red-500/20',
  gold:  'bg-ao-gold/15  text-ao-gold  border-ao-gold/25',
  muted: 'bg-white/5     text-ao-muted  border-white/10',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
}

export function Badge({ color = 'muted', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        badgeColors[color],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
