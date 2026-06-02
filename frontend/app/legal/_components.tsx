import type { ReactNode } from 'react';

export const Title = ({ children, updated }: { children: ReactNode; updated: string }) => (
  <div className="mb-6">
    <h1 className="text-2xl font-bold text-white">{children}</h1>
    <p className="text-xs text-zinc-500 mt-1">Last updated: {updated}</p>
  </div>
);

export const H2 = ({ children }: { children: ReactNode }) => (
  <h2 className="text-lg font-semibold text-white mt-8 mb-3">{children}</h2>
);

export const P = ({ children }: { children: ReactNode }) => (
  <p className="text-sm text-zinc-300 leading-relaxed mb-3">{children}</p>
);

export const UL = ({ children }: { children: ReactNode }) => (
  <ul className="list-disc pl-5 space-y-1.5 text-sm text-zinc-300 mb-3 marker:text-zinc-600">{children}</ul>
);

export const Note = ({ children }: { children: ReactNode }) => (
  <div className="rounded-lg border border-amber-700/40 bg-amber-950/20 p-3 text-xs text-amber-300/90 mb-6">
    {children}
  </div>
);
