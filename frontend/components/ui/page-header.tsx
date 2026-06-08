import * as React from 'react';

export function PageHeader({
  title, subtitle, actions,
}: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
