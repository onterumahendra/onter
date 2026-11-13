import { describe, expect, it } from 'vite-plus/test';
import { sanitizeSheetName } from './sanitizeSheetName';

describe('sanitizeSheetName', () => {
  it('preserves RTL names while removing Excel-forbidden characters', () => {
    expect(sanitizeSheetName('بيانات / الأسرة')).toBe('بيانات الأسرة');
  });

  it('truncates to Excel limits and creates case-insensitive unique names', () => {
    const usedNames = new Set<string>();

    expect(sanitizeSheetName('A'.repeat(32), usedNames)).toBe('A'.repeat(31));
    expect(sanitizeSheetName('a'.repeat(32), usedNames)).toBe(`${'a'.repeat(29)}_1`);
  });
});
