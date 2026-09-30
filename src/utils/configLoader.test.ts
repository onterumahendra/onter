import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearConfigCache, isCountryAvailable, loadCountryConfig, preloadConfigs } from './configLoader';
import { DEFAULT_COUNTRY } from '../constants/countries';
import type { CountryFormConfig } from '../constants/types';

const config = (countryCode: string): CountryFormConfig => ({
  countryCode,
  countryName: countryCode,
  currency: 'USD',
  currencySymbol: '$',
  formSections: [],
});

const response = (value: CountryFormConfig, ok = true) => ({ ok, json: async () => value });

describe('configLoader', () => {
  beforeEach(() => {
    clearConfigCache();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('loads and caches a country configuration', async () => {
    const fetchMock = vi.mocked(fetch).mockResolvedValue(response(config('US')) as Response);
    const first = await loadCountryConfig('US');
    const second = await loadCountryConfig('US');
    expect(first).toEqual(config('US'));
    expect(second).toBe(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('configs/US.json'));
  });

  it('falls back to the default country when a requested config fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.mocked(fetch)
      .mockResolvedValueOnce(response(config('CA'), false) as Response)
      .mockResolvedValueOnce(response(config(DEFAULT_COUNTRY)) as Response);
    await expect(loadCountryConfig('CA')).resolves.toEqual(config(DEFAULT_COUNTRY));
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('rethrows failures for the default country', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(fetch).mockResolvedValue(response(config(DEFAULT_COUNTRY), false) as Response);
    await expect(loadCountryConfig(DEFAULT_COUNTRY)).rejects.toThrow(`Failed to load config for ${DEFAULT_COUNTRY}`);
  });

  it('preloads all requested configs and checks availability with HEAD', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(response(config('IN')) as Response)
      .mockResolvedValueOnce(response(config('US')) as Response)
      .mockResolvedValueOnce({ ok: true } as Response);
    await expect(preloadConfigs(['IN', 'US'])).resolves.toBeUndefined();
    await expect(isCountryAvailable('CA')).resolves.toBe(true);
    expect(fetch).toHaveBeenLastCalledWith(expect.stringContaining('configs/CA.json'), { method: 'HEAD' });
  });

  it('returns false when the availability request rejects', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('offline'));
    await expect(isCountryAvailable('XX')).resolves.toBe(false);
  });
});
