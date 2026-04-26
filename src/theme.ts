import { createTheme, type MantineColorsTuple } from '@mantine/core';

// Custom color palettes based on your design system
const blue: MantineColorsTuple = [
  '#EFF6FF', // lightest
  '#DBEAFE',
  '#BFDBFE',
  '#93C5FD',
  '#60A5FA',
  '#2563EB', // Primary Blue
  '#1D4ED8', // Hover
  '#1E40AF', // Active
  '#1E3A8A',
  '#1E293B', // darkest
];

const teal: MantineColorsTuple = [
  '#F0FDFA',
  '#CCFBF1',
  '#99F6E4',
  '#5EEAD4',
  '#2DD4BF',
  '#14B8A6', // Accent Teal
  '#0D9488',
  '#0F766E',
  '#115E59',
  '#134E4A',
];

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
  colors: {
    blue,
    teal,
    slate,
  },
  
  fontFamily: '"Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  
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
    fontFamily: '"Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
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
    btnPrimary: '#2563EB',
    btnPrimaryHover: '#1D4ED8',
    btnPrimaryActive: '#1E40AF',
    btnPrimaryDisabled: '#93C5FD',
    
    // Secondary button
    btnSecondary: '#E2E8F0',
    btnSecondaryText: '#1E293B',
    btnSecondaryHover: '#CBD5E1',
    btnSecondaryBorder: '#CBD5E1',
    
    // Outline button
    btnOutlineBorder: '#2563EB',
    btnOutlineText: '#2563EB',
    btnOutlineHover: '#EFF6FF',
    
    // Links
    linkDefault: '#2563EB',
    linkHover: '#1D4ED8',
    linkVisited: '#7C3AED',
    linkActive: '#1E40AF',
    
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
    tabActiveText: '#2563EB',
    tabActiveBorder: '#2563EB',
    tabInactiveBg: '#F1F5F9',
    tabInactiveText: '#475569',
    tabHoverBg: '#E2E8F0',
  },
});
