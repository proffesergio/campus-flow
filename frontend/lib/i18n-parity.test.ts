import { describe, it, expect } from 'vitest';
import en from '../messages/en.json';
import bn from '../messages/bn.json';

/** Recursively collect all dotted key paths from an object. */
function collectPaths(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return [prefix];
  }
  const paths: string[] = [];
  for (const key of Object.keys(obj as Record<string, unknown>)) {
    const full = prefix ? `${prefix}.${key}` : key;
    paths.push(...collectPaths((obj as Record<string, unknown>)[key], full));
  }
  return paths;
}

describe('i18n parity: en.json vs bn.json', () => {
  it('must have exactly the same key paths in both locales', () => {
    const enPaths = new Set(collectPaths(en));
    const bnPaths = new Set(collectPaths(bn));

    const inEnNotBn = [...enPaths].filter((k) => !bnPaths.has(k));
    const inBnNotEn = [...bnPaths].filter((k) => !enPaths.has(k));

    const differences: string[] = [
      ...inEnNotBn.map((k) => `  MISSING from bn: ${k}`),
      ...inBnNotEn.map((k) => `  MISSING from en: ${k}`),
    ];

    expect(differences, `Key parity failures:\n${differences.join('\n')}`).toHaveLength(0);
  });
});
