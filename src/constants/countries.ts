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
  { code: "AU", name: "Australia" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "Great Britain" },
  { code: "HK", name: "Hong Kong" },
  { code: "IN", name: "India" },
  { code: "IE", name: "Ireland" },
  { code: "JP", name: "Japan" },
  { code: "NZ", name: "New Zealand" },
  { code: "SG", name: "Singapore" },
  { code: "KR", name: "South Korea" },
  { code: "US", name: "United States" }
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
