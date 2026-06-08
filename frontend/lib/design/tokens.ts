import type { Variants } from 'framer-motion';

// Refined Dark palette (Tailwind class fragments + raw hex for charts).
export const ACCENTS = {
  blue:    { text: 'text-blue-400',    bg: 'bg-blue-500/10',    ring: 'border-blue-500/20',    hex: '#3b82f6' },
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', ring: 'border-emerald-500/20', hex: '#22c55e' },
  purple:  { text: 'text-purple-400',  bg: 'bg-purple-500/10',  ring: 'border-purple-500/20',  hex: '#a855f7' },
  amber:   { text: 'text-amber-400',   bg: 'bg-amber-500/10',   ring: 'border-amber-500/20',   hex: '#f59e0b' },
  red:     { text: 'text-red-400',     bg: 'bg-red-500/10',     ring: 'border-red-500/20',     hex: '#ef4444' },
} as const;

export type AccentName = keyof typeof ACCENTS;

export const SURFACE = 'bg-zinc-900 border border-zinc-800 rounded-xl';

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
