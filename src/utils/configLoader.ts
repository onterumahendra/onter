import type { CountryFormConfig } from '../constants/types';
import { AVAILABLE_COUNTRIES, DEFAULT_COUNTRY, getCountryCodes } from '../constants/countries';
import { publicAsset } from './paths';

/**
 * Cache for loaded country configurations
 */
const configCache = new Map<string, CountryFormConfig>();

/**
 * Load country configuration from JSON file
 * @param countryCode - ISO country code (e.g., 'IN', 'US')
 * @returns Promise with country configuration
 */
export async function loadCountryConfig(countryCode: string): Promise<CountryFormConfig> {
  // Check cache first
  if (configCache.has(countryCode)) {
    return configCache.get(countryCode)!;
  }

  try {
    const configPath = publicAsset(`configs/${countryCode}.json`);
    const response = await fetch(configPath);
    
    if (!response.ok) {
      throw new Error(`Failed to load config for ${countryCode}`);
    }

    const config: CountryFormConfig = await response.json();
    
    // Store in cache
    configCache.set(countryCode, config);
    
    return config;
  } catch (error) {
    console.error(`Error loading config for ${countryCode}:`, error);
    
    // Fallback to default country if requested country fails
    if (countryCode !== DEFAULT_COUNTRY) {
      console.warn(`Falling back to ${DEFAULT_COUNTRY} configuration`);
      return loadCountryConfig(DEFAULT_COUNTRY);
    }
    
    throw error;
  }
}

/**
 * Preload multiple country configurations
 * @param countryCodes - Array of country codes to preload
 */
export async function preloadConfigs(countryCodes: string[]): Promise<void> {
  const loadPromises = countryCodes.map(code => loadCountryConfig(code));
  await Promise.allSettled(loadPromises);
}

/**
 * Clear the configuration cache
 */
export function clearConfigCache(): void {
  configCache.clear();
}

/**
 * Check if a country configuration is available
 * @param countryCode - ISO country code
 * @returns Boolean indicating if config exists
 */
export async function isCountryAvailable(countryCode: string): Promise<boolean> {
  try {
    const configPath = publicAsset(`configs/${countryCode}.json`);
    const response = await fetch(configPath, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Re-export constants for convenience
 */
export { AVAILABLE_COUNTRIES, DEFAULT_COUNTRY, getCountryCodes };
