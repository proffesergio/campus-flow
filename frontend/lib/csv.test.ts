import { describe, it, expect } from 'vitest';
import { toCsv } from './csv';

describe('toCsv', () => {
  it('writes a header row and escapes commas/quotes/newlines', () => {
    const csv = toCsv(
      [{ a: 'x', b: 'has,comma' }, { a: 'quote"d', b: 'line\nbreak' }],
      [{ key: 'a', header: 'A' }, { key: 'b', header: 'B' }],
    );
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('A,B');
    expect(lines[1]).toBe('x,"has,comma"');
    // the quoted field with an embedded newline keeps the newline inside quotes
    expect(csv).toContain('"quote""d","line\nbreak"');
  });

  it('returns just the header when there are no rows', () => {
    expect(toCsv([], [{ key: 'a', header: 'A' }])).toBe('A');
  });
});
