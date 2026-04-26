/**
 * Feature flags for enabling/disabling features
 * Toggle these to enable features in development or production
 */
export const FEATURE_FLAGS = {
  /**
   * Enable passphrase encryption for data
   * When disabled, data is stored without encryption
   * @default false (descoped for now)
   */
  ENABLE_PASSPHRASE: false,
} as const;
