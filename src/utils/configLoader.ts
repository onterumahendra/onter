import type { RawCountryFormConfig } from '../constants/types';
import { AVAILABLE_COUNTRIES, DEFAULT_COUNTRY, getCountryCodes } from '../constants/countries';

const configModules = import.meta.glob<RawCountryFormConfig>('../config/*.json', {
  import: 'default',
});

const configCache = new Map<string, RawCountryFormConfig>();

/**
 * Load only the requested country's structural configuration.
 */
export async function loadCountryConfig(countryCode: string): Promise<RawCountryFormConfig> {
  const cached = configCache.get(countryCode);
  if (cached) return cached;

  if (!/^[A-Z]{2}$/.test(countryCode)) {
    throw new Error(`Invalid country code: ${countryCode}`);
  }

  const modulePath = `../config/${countryCode}.json`;
  const loadConfig = configModules[modulePath];
  if (!loadConfig) {
    throw new Error(`No configuration found for ${countryCode}`);
  }

  const config = await loadConfig();
  if (config.countryCode !== countryCode) {
    throw new Error(`Configuration country code mismatch for ${countryCode}`);
  }

  configCache.set(countryCode, config);
  return config;
}

/**
 * Preload multiple country configurations.
 */
export async function preloadConfigs(countryCodes: string[]): Promise<void> {
  await Promise.allSettled(countryCodes.map(code => loadCountryConfig(code)));
}

export function clearConfigCache(): void {
  configCache.clear();
}

export async function isCountryAvailable(countryCode: string): Promise<boolean> {
  if (!/^[A-Z]{2}$/.test(countryCode)) return false;
  return Object.hasOwn(configModules, `../config/${countryCode}.json`);
}

export { AVAILABLE_COUNTRIES, DEFAULT_COUNTRY, getCountryCodes };
