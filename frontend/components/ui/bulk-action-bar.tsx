'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export function BulkActionBar({
  count, onClear, children,
}: { count: number; onClear: () => void; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="sticky bottom-4 z-30 mx-auto w-fit flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900/95 backdrop-blur px-4 py-2 shadow-2xl"
        >
          <span className="text-sm text-zinc-300 whitespace-nowrap">{count} selected</span>
          <div className="flex items-center gap-2">{children}</div>
          <button onClick={onClear} className="text-zinc-500 hover:text-zinc-300" aria-label="Clear selection">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
