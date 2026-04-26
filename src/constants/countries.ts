/**
 * Country configuration constants
 */

export interface Country {
  code: string;
  name: string;
}

/**
 * List of all available countries
 */
export const AVAILABLE_COUNTRIES: Country[] = [
    { code: "IN", name: "India" }
];

/**
 * Default country code
 */
export const DEFAULT_COUNTRY = "IN";

/**
 * Get array of country codes only
 */
export function getCountryCodes(): string[] {
  return AVAILABLE_COUNTRIES.map(c => c.code);
}
