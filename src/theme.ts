/* eslint-disable @typescript-eslint/no-explicit-any */
import { createTheme, type MantineColorsTuple } from '@mantine/core';
import { brand } from './branding';

const slate: MantineColorsTuple = [
  '#F8FAFC', // Secondary background
  '#F1F5F9',
  '#E2E8F0', // Secondary button bg
  '#CBD5E1',
  '#94A3B8', // Muted text
  '#475569', // Secondary text
  '#334155', // Logo text
  '#1E293B',
  '#0F172A', // Primary text
  '#020617',
];

export const theme = createTheme({
  primaryColor: 'blue',
  primaryShade: { light: 5, dark: 5 },
  colors: {
    blue: brand.primaryPalette,
    teal: brand.accentPalette,
    slate,
  },
  
  fontFamily: brand.fontFamily,
  
  white: '#FFFFFF',
  black: '#0F172A',
  
  // Component-specific overrides
  components: {
    Button: {
      defaultProps: {
        color: 'blue',
      },
      styles: {
        root: {
          fontWeight: 500,
        },
      },
    },
    
    Anchor: {
      defaultProps: {
        color: 'blue.5',
      },
    },
    
    Tabs: {
      styles: (theme: any) => ({
        tab: {
          '&[data-active]': {
            color: theme.colors.blue[5],
            borderBottomColor: theme.colors.blue[5],
          },
          '&:not([data-active])': {
            backgroundColor: theme.colors.slate[1],
            color: theme.colors.slate[5],
          },
          '&:hover:not([data-active])': {
            backgroundColor: theme.colors.slate[2],
          },
        },
      }),
    },
  },
  
  // Default radius
  defaultRadius: 'md',
  
  // Headings configuration
  headings: {
  fontFamily: brand.fontFamily,
    fontWeight: '600',
    sizes: {
      h1: { fontSize: '2.25rem', lineHeight: '2.5rem' },
      h2: { fontSize: '1.875rem', lineHeight: '2.25rem' },
      h3: { fontSize: '1.5rem', lineHeight: '2rem' },
      h4: { fontSize: '1.25rem', lineHeight: '1.75rem' },
      h5: { fontSize: '1.125rem', lineHeight: '1.75rem' },
      h6: { fontSize: '1rem', lineHeight: '1.5rem' },
    },
  },
  
  // Other colors for forms
  other: {
    // Primary text colors
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    textInverse: '#FFFFFF',
    
    // Button colors
    btnPrimary: brand.primaryPalette[5],
    btnPrimaryHover: brand.primaryPalette[6],
    btnPrimaryActive: brand.primaryPalette[7],
    btnPrimaryDisabled: brand.primaryPalette[3],
    
    // Secondary button
    btnSecondary: '#E2E8F0',
    btnSecondaryText: '#1E293B',
    btnSecondaryHover: '#CBD5E1',
    btnSecondaryBorder: '#CBD5E1',
    
    // Outline button
    btnOutlineBorder: brand.primaryPalette[5],
    btnOutlineText: brand.primaryPalette[5],
    btnOutlineHover: brand.primaryPalette[0],
    
    // Links
    linkDefault: brand.primaryPalette[5],
    linkHover: brand.primaryPalette[6],
    linkVisited: '#7C3AED',
    linkActive: brand.primaryPalette[7],
    
    // Backgrounds
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F8FAFC',
    bgCard: '#FFFFFF',
    
    // Dark mode (for future use)
    bgDarkPrimary: '#0F172A',
    bgDarkSecondary: '#1E293B',
    
    // Form error
    errorBg: '#FEF2F2',
    errorBorder: '#F87171',
    errorText: '#DC2626',
    
    // Form success
    successBg: '#ECFDF5',
    successBorder: '#34D399',
    successText: '#059669',
    
    // Tabs
    tabActiveBg: '#FFFFFF',
    tabActiveText: brand.primaryPalette[5],
    tabActiveBorder: brand.primaryPalette[5],
    tabInactiveBg: '#F1F5F9',
    tabInactiveText: '#475569',
    tabHoverBg: '#E2E8F0',
  },
});
