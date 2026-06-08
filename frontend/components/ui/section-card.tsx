import * as React from 'react';
import { SURFACE } from '@/lib/design/tokens';
import { cn } from '@/lib/utils';

export function SectionCard({
  title, action, className, children,
}: { title?: string; action?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn(SURFACE, 'p-4', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-3">
          {title && <h3 className="text-sm font-medium text-zinc-300">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
