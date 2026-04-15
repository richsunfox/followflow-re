/**
 * Merges class strings, filtering falsy values.
 * Lightweight alternative to clsx/classnames — no extra dependency needed.
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
