import type { ReactNode } from 'react';

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start gap-3 border-b border-line pb-4">
      <div className="mr-auto min-w-0">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mt-0.5 text-sm text-muted">{description}</p>
      </div>
      {action}
    </div>
  );
}
