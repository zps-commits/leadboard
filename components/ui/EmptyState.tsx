import type { ReactNode } from 'react';

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 p-10 text-center">
      {icon ? (
        <span aria-hidden="true" className="rounded-full border border-line bg-paper p-3">
          {icon}
        </span>
      ) : null}
      <div>
        <p className="font-medium">{title}</p>
        <p className="mx-auto mt-1 max-w-prose text-sm text-muted">{description}</p>
      </div>
      {action}
    </div>
  );
}
