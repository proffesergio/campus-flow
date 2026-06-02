'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { cn } from '@/lib/utils';

const LOCALES = [
  { code: 'en', label: 'EN' },
  { code: 'bn', label: 'বাংলা' },
] as const;

/** One-click English ⇄ Bangla switch. Persists choice in the NEXT_LOCALE cookie
 *  (read server-side by i18n/request.ts) and refreshes server components. */
export default function LanguageToggle({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setLocale(code: string) {
    if (code === locale) return;
    // 1 year; not httpOnly so the toggle can read/write it client-side.
    document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border border-zinc-700 bg-zinc-900 p-0.5',
        pending && 'opacity-60',
        className,
      )}
      role="group"
      aria-label="Language"
    >
      {LOCALES.map((l) => (
        <button
          key={l.code}
          onClick={() => setLocale(l.code)}
          disabled={pending}
          aria-pressed={locale === l.code}
          className={cn(
            'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
            locale === l.code
              ? 'bg-emerald-600 text-white'
              : 'text-zinc-400 hover:text-zinc-200',
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
