import type { ReactNode } from 'react';

/**
 * A label, a control and the message for that control, tied together.
 *
 * The error is referenced by aria-describedby rather than only being
 * coloured red, so it is read out with the field it belongs to.
 */
export function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string | undefined;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="mt-0.5 text-xs text-muted">
          {hint}
        </p>
      ) : null}
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-sm text-bad">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const inputClass =
  'w-full min-w-0 rounded-lg border border-line bg-surface px-3 py-2 text-sm placeholder:text-muted/70';
