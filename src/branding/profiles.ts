import type { BrandConfig } from './types';

const onter: BrandConfig = {
  id: 'onter',
  name: 'Onter',
  appTitle: 'Onter | Family Legacy Organizer',
  description: 'Organize essential personal, financial, insurance, legal, and digital records for your family. Onter keeps information in your browser and supports seven country guides.',
  tagline: 'Organize today. Protect your family tomorrow.',
  fontFamily: '"Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  siteUrl: 'https://www.onter.app/',
  sourceUrl: 'https://github.com/onterumahendra/onter',
  logoAsset: 'logo.png',
  faviconAsset: 'logo_mini.ico',
  socialImageAsset: 'logo_mini.png',
  filePrefix: 'Onter_Care',
  accessGuideFilePrefix: 'Onter_Emergency_Access_Guide',
  recoveryRoadmapFilePrefix: 'Onter_Recovery_Roadmap',
  primaryPalette: [
    '#EFF6FF',
    '#DBEAFE',
    '#BFDBFE',
    '#93C5FD',
    '#60A5FA',
    '#2563EB',
    '#1D4ED8',
    '#1E40AF',
    '#1E3A8A',
    '#1E293B',
  ],
  accentPalette: [
    '#F0FDFA',
    '#CCFBF1',
    '#99F6E4',
    '#5EEAD4',
    '#2DD4BF',
    '#14B8A6',
    '#0D9488',
    '#0F766E',
    '#115E59',
    '#134E4A',
  ],
};

export const brandProfiles: Record<string, BrandConfig> = { onter };

export function resolveBrandProfile(id = 'onter'): BrandConfig {
  const profile = brandProfiles[id];
  if (!profile) {
    throw new Error(`Unknown brand profile "${id}". Add it to src/branding/profiles.ts.`);
  }
  return profile;
}
