import { describe, expect, it, vi } from 'vite-plus/test';
import { getAvailableCountries, getAvailableCountryCodes, getFormConfig, getFormSections, loadCountryConfig } from './index';
import { AVAILABLE_COUNTRIES, DEFAULT_COUNTRY } from './countries';
import { FEATURE_FLAGS } from './featureFlags';
import type { CountryFormConfig, RawCountryFormConfig } from './types';
import { loadCountryTranslations } from '../utils/i18nLoader';
import { localizeCountryConfig } from '../utils/localizeCountryConfig';

vi.mock('../utils/configLoader', () => ({
  loadCountryConfig: vi.fn(),
}));
vi.mock('../utils/i18nLoader', () => ({
  loadCountryTranslations: vi.fn(),
}));
vi.mock('../utils/localizeCountryConfig', () => ({
  localizeCountryConfig: vi.fn(),
}));

const config = {
  countryCode: 'IN',
  countryName: 'India',
  currency: 'INR',
  currencySymbol: 'Rs.',
  formSections: [{ section: 'Personal', type: 'simple', fields: [] }],
} as CountryFormConfig;

const rawConfig: RawCountryFormConfig = {
  countryCode: 'IN',
  currency: 'INR',
  currencySymbol: 'Rs.',
  formSections: [{ id: 'personal', type: 'simple', fields: [] }],
};

describe('country constants and public configuration API', () => {
  it('returns country metadata, codes, and feature flags', () => {
    expect(getAvailableCountries()).toBe(AVAILABLE_COUNTRIES);
    expect(getAvailableCountryCodes()).toEqual(['AU', 'CA', 'GB', 'HK', 'IN', 'IE', 'JP', 'NZ', 'SG', 'KR', 'US']);
    expect(DEFAULT_COUNTRY).toBe('IN');
    expect(FEATURE_FLAGS.ENABLE_PASSPHRASE).toBe(false);
  });

  it('loads country config and sections with the default or requested country', async () => {
    vi.mocked(loadCountryConfig).mockResolvedValue(rawConfig);
    vi.mocked(loadCountryTranslations).mockResolvedValue({});
    vi.mocked(localizeCountryConfig).mockReturnValue(config);
    await expect(getFormConfig()).resolves.toBe(config);
    await expect(getFormConfig('US')).resolves.toBe(config);
    await expect(getFormSections('CA')).resolves.toEqual(config.formSections);
    expect(loadCountryConfig).toHaveBeenNthCalledWith(1, DEFAULT_COUNTRY);
    expect(loadCountryConfig).toHaveBeenNthCalledWith(2, 'US');
    expect(loadCountryConfig).toHaveBeenNthCalledWith(3, 'CA');
    expect(loadCountryTranslations).toHaveBeenNthCalledWith(1, DEFAULT_COUNTRY);
    expect(localizeCountryConfig).toHaveBeenNthCalledWith(1, rawConfig, {});
  });
});
