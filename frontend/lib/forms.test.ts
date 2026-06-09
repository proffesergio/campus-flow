import { describe, it, expect } from 'vitest';
import { filterOptions } from './forms';

const opts = [
  { value: '1', label: 'Class 6' },
  { value: '2', label: 'Class 7 - A' },
  { value: '3', label: 'Mathematics' },
];

describe('filterOptions', () => {
  it('returns all for empty query', () => expect(filterOptions(opts, '')).toHaveLength(3));
  it('matches case-insensitively by label substring', () => {
    expect(filterOptions(opts, 'class').map((o) => o.value)).toEqual(['1', '2']);
    expect(filterOptions(opts, 'MATH')).toHaveLength(1);
  });
  it('returns [] when nothing matches', () => expect(filterOptions(opts, 'zzz')).toEqual([]));
});
