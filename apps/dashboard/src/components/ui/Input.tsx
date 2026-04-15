import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '@/lib/cn';

// ─── Base input styles ─────────────────────────────────────────────────────────

const inputBase = [
  'w-full bg-ao-surface border border-ao-border rounded-lg',
  'text-white placeholder:text-ao-muted text-sm',
  'transition-colors duration-150',
  'focus:outline-none focus:ring-2 focus:ring-ao-blue focus:border-transparent',
  'disabled:opacity-50 disabled:cursor-not-allowed',
].join(' ');

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:    string;
  error?:    string;
  helper?:   string;
  /** Prepend a small icon/text inside the left edge */
  leftSlot?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helper, leftSlot, className, id, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-white">
          {label}
          {props.required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {leftSlot && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ao-muted pointer-events-none">
            {leftSlot}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            inputBase,
            'px-3.5 py-2.5 h-10',
            leftSlot ? 'pl-9' : undefined,
            error ? 'border-red-500 focus:ring-red-500' : undefined,
            className,
          )}
          {...props}
        />
      </div>
      {error  && <p className="text-red-400 text-sm">{error}</p>}
      {!error && helper && <p className="text-ao-muted text-sm">{helper}</p>}
    </div>
  );
});

Input.displayName = 'Input';

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?:  string;
  error?:  string;
  helper?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, helper, className, id, ...props },
  ref,
) {
  const autoId = useId();
  const textareaId = id ?? autoId;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium text-white">
          {label}
          {props.required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        className={cn(
          inputBase,
          'px-3.5 py-2.5 resize-y min-h-[80px]',
          error && 'border-red-500 focus:ring-red-500',
          className,
        )}
        {...props}
      />
      {error  && <p className="text-red-400 text-sm">{error}</p>}
      {!error && helper && <p className="text-ao-muted text-sm">{helper}</p>}
    </div>
  );
});

Textarea.displayName = 'Textarea';

// ─── Light Input (for use on #F7F8FC backgrounds) ─────────────────────────────

const inputBaseLight = [
  'w-full bg-white border border-[#D1D9E0] rounded-lg',
  'text-[#0F1629] placeholder:text-slate-400 text-sm',
  'transition-colors duration-150',
  'focus:outline-none focus:ring-2 focus:ring-ao-blue focus:border-transparent',
  'disabled:opacity-50 disabled:cursor-not-allowed',
].join(' ');

interface LightInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:  string;
  error?:  string;
  helper?: string;
}

export const LightInput = forwardRef<HTMLInputElement, LightInputProps>(function LightInput(
  { label, error, helper, className, id, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[#0F1629]">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          inputBaseLight,
          'px-3.5 py-2.5 h-10',
          error && 'border-red-500 focus:ring-red-500',
          className,
        )}
        {...props}
      />
      {error  && <p className="text-red-500 text-sm">{error}</p>}
      {!error && helper && <p className="text-slate-500 text-sm">{helper}</p>}
    </div>
  );
});

LightInput.displayName = 'LightInput';
