import type { CountryFormConfig } from './types';
import { loadCountryConfig } from '../utils/configLoader';
import { AVAILABLE_COUNTRIES, DEFAULT_COUNTRY, getCountryCodes } from './countries';
import type { Country } from './countries';

/**
 * Get form configuration for a specific country (async)
 * @param countryCode - ISO country code (e.g., 'IN', 'US', 'UK')
 * @returns Promise with country-specific form configuration
 */
export async function getFormConfig(countryCode: string = DEFAULT_COUNTRY): Promise<CountryFormConfig> {
  return await loadCountryConfig(countryCode);
}

/**
 * Get form sections for a specific country (async)
 * @param countryCode - ISO country code
 * @returns Promise with array of form sections
 */
export async function getFormSections(countryCode: string = DEFAULT_COUNTRY) {
  const config = await getFormConfig(countryCode);
  return config.formSections;
}

// Re-export commonly used items
export function getAvailableCountries(): Country[] {
  return AVAILABLE_COUNTRIES;
}

export function getAvailableCountryCodes(): string[] {
  return getCountryCodes();
}

// Export types
export * from './types';

// Export feature flags
export * from './featureFlags';

// Export countries
export { DEFAULT_COUNTRY, AVAILABLE_COUNTRIES } from './countries';
export type { Country } from './countries';

// Export config loader
export { loadCountryConfig } from '../utils/configLoader';
