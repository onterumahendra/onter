import { resolveBrandProfile } from './profiles';

export const brand = resolveBrandProfile(import.meta.env.VITE_BRAND_ID || 'onter');
export { resolveBrandProfile } from './profiles';
export type { BrandConfig } from './types';
