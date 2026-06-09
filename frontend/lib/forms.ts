export interface Option { value: string; label: string }

/** Case-insensitive substring filter for searchable selects. Empty query returns all. */
export function filterOptions(options: Option[], query: string): Option[] {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  return options.filter((o) => o.label.toLowerCase().includes(q));
}
