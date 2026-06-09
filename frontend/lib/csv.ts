import Papa from 'papaparse';

export interface CsvColumn<T> { key: keyof T & string; header: string }

function esc(v: unknown): string {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Serialize rows to CSV using the given columns for header + order. */
export function toCsv<T extends Record<string, unknown>>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => esc(c.header)).join(',');
  const body = rows.map((r) => columns.map((c) => esc(r[c.key])).join(',')).join('\r\n');
  return body ? `${header}\r\n${body}` : header;
}

/** Trigger a browser download of CSV text. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Defer revoke so Firefox/Safari can finish fetching the blob before it's freed.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export interface ParsedCsv { headers: string[]; rows: Record<string, string>[] }

/** Parse CSV text into header-keyed rows (skips empty lines). */
export function parseCsv(text: string): ParsedCsv {
  const result = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  const headers = result.meta.fields ?? [];
  return { headers, rows: result.data };
}
