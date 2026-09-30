import { describe, expect, it } from 'vitest';
import i18n from './i18n';
import { theme } from './theme';
import { AVAILABLE_COUNTRIES, DEFAULT_COUNTRY, getCountryCodes } from './constants/countries_old';

describe('application configuration', () => {
  it('initializes English translations and the application theme', () => {
    expect(i18n.language).toBe('en');
    expect(theme.primaryColor).toBe('blue');
    expect(theme.colors?.teal).toBeDefined();
    expect(typeof (theme.components as any).Tabs.styles).toBe('function');
    const styles = (theme.components as any).Tabs.styles({ colors: { blue: ['#0', '#1', '#2', '#3', '#4', '#5'], slate: ['#0', '#1', '#2', '#3', '#4', '#5'] } });
    expect(styles.tab['&[data-active]'].color).toBe('#5');
  });

  it('keeps the legacy country catalog internally consistent', () => {
    expect(DEFAULT_COUNTRY).toBe('IN');
    expect(AVAILABLE_COUNTRIES.length).toBeGreaterThan(100);
    expect(getCountryCodes()).toContain('US');
    expect(getCountryCodes()).toHaveLength(AVAILABLE_COUNTRIES.length);
  });
});
