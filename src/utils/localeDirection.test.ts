import { describe, expect, it } from 'vite-plus/test';
import { getTextDirection } from './localeDirection';

describe('getTextDirection', () => {
  it.each([
    'ar', 'he', 'iw', 'fa', 'ps', 'ckb', 'ku', 'sd', 'ug', 'ur',
    'yi', 'ji', 'dv', 'syr', 'arc', 'ks', 'nqo', 'ff-Adlm', 'az-Arab',
    'ks-Arab', 'ms-Arab', 'pa-Arab', 'pnb',
  ])('returns RTL for %s', (locale) => {
    expect(getTextDirection(locale)).toBe('rtl');
  });

  it('uses an explicit script subtag to distinguish direction', () => {
    expect(getTextDirection('pa-Guru')).toBe('ltr');
    expect(getTextDirection('pa-Arab')).toBe('rtl');
    expect(getTextDirection('en')).toBe('ltr');
  });
});
