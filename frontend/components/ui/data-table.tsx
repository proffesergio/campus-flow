'use client';

import * as React from 'react';
import { SURFACE } from '@/lib/design/tokens';
import { Skeleton } from '@/components/ui/skeleton';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render: (row: T) => React.ReactNode;
  className?: string;
}

export function DataTable<T>({
  rows, columns, getId, loading, selectedIds, onSelectionChange, empty,
}: {
  rows: T[];
  columns: Column<T>[];
  getId: (row: T) => string;
  loading?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  empty?: React.ReactNode;
}) {
  const selectable = !!selectedIds && !!onSelectionChange;
  const allSelected = selectable && rows.length > 0 && rows.every((r) => selectedIds!.has(getId(r)));

  function toggleAll() {
    if (!selectable) return;
    const next = new Set(selectedIds);
    if (allSelected) rows.forEach((r) => next.delete(getId(r)));
    else rows.forEach((r) => next.add(getId(r)));
    onSelectionChange!(next);
  }

  function toggle(id: string) {
    if (!selectable) return;
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange!(next);
  }

  const colSpan = columns.length + (selectable ? 1 : 0);

  return (
    <div className={`${SURFACE} overflow-hidden`}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-800">
            {selectable && (
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded border-zinc-600 bg-zinc-800" aria-label="Select all" />
              </th>
            )}
            {columns.map((c) => (
              <th key={c.key} className={`text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3 ${c.className ?? ''}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="border-b border-zinc-800/50">
                {selectable && <td className="px-4 py-3"><Skeleton className="h-4 w-4 bg-zinc-800" /></td>}
                {columns.map((c) => <td key={c.key} className="px-4 py-3"><Skeleton className="h-4 w-24 bg-zinc-800" /></td>)}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr><td colSpan={colSpan} className="px-4 py-12">{empty}</td></tr>
          ) : (
            rows.map((r) => {
              const id = getId(r);
              const sel = selectable && selectedIds!.has(id);
              return (
                <tr key={id} className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors ${sel ? 'bg-blue-500/5' : ''}`}>
                  {selectable && (
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={sel} onChange={() => toggle(id)} className="rounded border-zinc-600 bg-zinc-800" aria-label="Select row" />
                    </td>
                  )}
                  {columns.map((c) => <td key={c.key} className={`px-4 py-3 ${c.className ?? ''}`}>{c.render(r)}</td>)}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
