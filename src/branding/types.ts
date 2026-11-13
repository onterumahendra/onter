import type { MantineColorsTuple } from '@mantine/core';

export interface BrandConfig {
  id: string;
  name: string;
  appTitle: string;
  description: string;
  tagline: string;
  fontFamily: string;
  siteUrl: string;
  sourceUrl?: string;
  logoAsset: string;
  faviconAsset: string;
  socialImageAsset: string;
  filePrefix: string;
  accessGuideFilePrefix: string;
  recoveryRoadmapFilePrefix: string;
  primaryPalette: MantineColorsTuple;
  accentPalette: MantineColorsTuple;
  rtlPdfFont?: {
    family: string;
    regularAsset: string;
    boldAsset: string;
  };
}
