// Locale-aware formatting helpers. Pure (no React / next-intl imports) so they
// are safe in both server and client components. Pass the active locale in;
// in client components get it via `useLocale()` from next-intl.

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export type AppLocale = 'en' | 'bn';

/** Convert ASCII digits in a string/number to Bengali numerals (০-৯). */
export function toBengaliDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]!);
}

/** Format a number with thousands separators, in Bengali numerals when locale=bn. */
export function formatNumber(value: number, locale: AppLocale = 'en'): string {
  const s = value.toLocaleString('en-US');
  return locale === 'bn' ? toBengaliDigits(s) : s;
}

/** Format a money amount (defaults to BDT ৳), localizing the digits. */
export function formatCurrency(value: number, locale: AppLocale = 'en', currency = 'BDT'): string {
  const symbol = currency === 'BDT' ? '৳ ' : `${currency} `;
  return symbol + formatNumber(value, locale);
}

/** Format a date as e.g. "02 Jun 2026", localizing the digits when locale=bn. */
export function formatDate(date: Date | string, locale: AppLocale = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const s = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  return locale === 'bn' ? toBengaliDigits(s) : s;
}

/** Format a percentage, localizing digits. */
export function formatPercent(value: number, locale: AppLocale = 'en'): string {
  return `${formatNumber(value, locale)}%`;
}
