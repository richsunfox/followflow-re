'use client';

import { useEffect, useCallback, HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModalProps {
  open:        boolean;
  onClose:     () => void;
  title?:      string;
  description?: string;
  /** 'sm' = 448px  |  'md' = 560px (default)  |  'lg' = 720px  |  'xl' = 900px */
  size?:       'sm' | 'md' | 'lg' | 'xl';
  /** Remove default 24px padding on the body (useful for full-bleed content) */
  noPad?:      boolean;
  children:    React.ReactNode;
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

// ─── Modal ────────────────────────────────────────────────────────────────────

export function Modal({
  open,
  onClose,
  title,
  description,
  size    = 'md',
  noPad   = false,
  children,
}: ModalProps) {
  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop-in"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      {/* Container — stop propagation so clicking inside doesn't close */}
      <div
        className={cn(
          'relative w-full bg-ao-surface border border-ao-border rounded-2xl',
          'shadow-2xl animate-modal-in',
          sizeMap[size],
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        {(title || description) && (
          <div className="px-6 pt-6 pb-4 border-b border-ao-border">
            <div className="flex items-start justify-between gap-4">
              <div>
                {title && (
                  <h2 className="text-white font-semibold text-lg leading-snug">{title}</h2>
                )}
                {description && (
                  <p className="text-ao-muted text-sm mt-1">{description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-ao-muted hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Close button when there's no header */}
        {!title && !description && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-ao-muted hover:text-white hover:bg-white/[0.08] transition-colors z-10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Body */}
        <div className={cn(!noPad && 'p-6')}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── ModalFooter ──────────────────────────────────────────────────────────────

export function ModalFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 px-6 py-4 border-t border-ao-border',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
