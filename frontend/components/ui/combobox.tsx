'use client';

import * as React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { filterOptions, Option } from '@/lib/forms';

export function Combobox({
  options, value, onChange, placeholder = 'Select…', disabled,
}: {
  options: Option[];
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const selected = options.find((o) => o.value === value);
  const filtered = filterOptions(options, query);

  return (
    <Popover.Root open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery(''); }}>
      <Popover.Trigger asChild disabled={disabled}>
        <button
          type="button"
          className="w-full h-10 flex items-center justify-between rounded-lg bg-zinc-800 border border-zinc-700 px-3 text-sm text-left disabled:opacity-50"
        >
          <span className={selected ? 'text-white' : 'text-zinc-500'}>{selected ? selected.label : placeholder}</span>
          <ChevronsUpDown className="w-4 h-4 text-zinc-500 flex-shrink-0" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className="z-50 w-[var(--radix-popover-trigger-width)] rounded-lg border border-zinc-700 bg-zinc-900 shadow-2xl p-1"
        >
          <div className="flex items-center gap-2 px-2 py-1.5 border-b border-zinc-800">
            <Search className="w-3.5 h-3.5 text-zinc-500" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-zinc-600 px-3 py-2">No matches</p>
            ) : filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); setQuery(''); }}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded text-sm text-zinc-300 hover:bg-zinc-800 text-left"
              >
                {o.label}
                {o.value === value && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
