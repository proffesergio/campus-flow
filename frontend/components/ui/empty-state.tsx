import * as React from 'react';
import type { LucideIcon } from 'lucide-react';

export function EmptyState({
  icon: Icon, title, description, action,
}: { icon: LucideIcon; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="py-12 text-center">
      <Icon className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
      <p className="text-zinc-400 font-medium">{title}</p>
      {description && <p className="text-zinc-600 text-sm mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
