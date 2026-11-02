import { beforeEach, describe, expect, it } from 'vite-plus/test';
import {
  clearConfigCache,
  isCountryAvailable,
  loadCountryConfig,
  preloadConfigs,
} from './configLoader';

describe('configLoader', () => {
  beforeEach(() => clearConfigCache());

  it('loads and caches only structural country configuration', async () => {
    const first = await loadCountryConfig('US');
    const second = await loadCountryConfig('US');

    expect(second).toBe(first);
    expect(first.countryCode).toBe('US');
    expect(first.formSections[0]).toHaveProperty('id', 'personalDetails');
    expect(first.formSections[0].fields?.[0]).not.toHaveProperty('label');
    expect(first.formSections[0].fields?.[0]).toHaveProperty('name');
  });

  it('does not silently fall back to another country configuration', async () => {
    await expect(loadCountryConfig('ZZ')).rejects.toThrow('No configuration found for ZZ');
    await expect(loadCountryConfig('IN-improved')).rejects.toThrow('Invalid country code: IN-improved');
  });

  it('preloads requested configs and checks availability from bundled configs', async () => {
    await expect(preloadConfigs(['IN', 'US'])).resolves.toBeUndefined();
    await expect(isCountryAvailable('CA')).resolves.toBe(true);
    await expect(isCountryAvailable('XX')).resolves.toBe(false);
    await expect(isCountryAvailable('IN-improved')).resolves.toBe(false);
  });

  it('keeps structural and machine-readable keys concise across all countries', async () => {
    for (const countryCode of ['AU', 'CA', 'GB', 'HK', 'IE', 'IN', 'JP', 'KR', 'NZ', 'SG', 'US']) {
      const config = await loadCountryConfig(countryCode);
      const oversized: string[] = [];
      const humanText: string[] = [];
      const visit = (value: unknown, path: string): void => {
        if (Array.isArray(value)) {
          if (path.endsWith('Keys') || path.endsWith('optionKeys')) {
            for (const key of value) {
              if (typeof key === 'string' && key.length > 32) oversized.push(`${path}: ${key}`);
            }
          }
          value.forEach((item, index) => visit(item, `${path}.${index}`));
          return;
        }
        if (!value || typeof value !== 'object') return;
        for (const [key, child] of Object.entries(value)) {
          if (key.length > 32) oversized.push(`${path}: ${key}`);
          if (
            typeof child === 'string' &&
            child.includes(' ') &&
            /[a-z]/i.test(child) &&
            key !== 'pattern' &&
            key !== '$i18n' &&
            !/^https?:\/\//i.test(child)
          ) {
            humanText.push(`${path}.${key}: ${child}`);
          }
          visit(child, `${path}.${key}`);
        }
      };

      visit(config, countryCode);
      expect(oversized, countryCode).toEqual([]);
      expect(humanText, countryCode).toEqual([]);
    }
  });
});
