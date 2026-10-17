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
    { code: "IN", name: "India" },
    { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "Great Britain" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" }
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
