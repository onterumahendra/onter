import { describe, expect, it } from 'vite-plus/test';
import { loadCountryConfig } from './configLoader';
import { loadCountryTranslations } from './i18nLoader';
import { localizeCountryConfig } from './localizeCountryConfig';

describe('localizeCountryConfig', () => {
  it('hydrates labels, options, validation messages, guide and roadmap text', async () => {
    const rawConfig = await loadCountryConfig('CA');
    const translations = await loadCountryTranslations('CA', 'en');
    const config = localizeCountryConfig(rawConfig, translations);
    const personalDetails = config.formSections[0];
    const fullName = personalDetails.type === 'simple'
      ? personalDetails.fields.find(field => field.name === 'full_name')
      : undefined;
    const province = personalDetails.type === 'simple'
      ? personalDetails.fields.find(field => field.name === 'province_territory')
      : undefined;

    expect(config.countryName).toBe('Canada');
    expect(personalDetails.section).toBe('Personal Details');
    expect(fullName?.label).toBe('Full Legal Name');
    expect(fullName?.validation?.errorMessages?.required).toBe('Full legal name is required');
    expect(province?.options).toContain('Alberta');
    expect(config.accessGuide?.quickStart.length).toBeGreaterThan(0);
    expect(config.accessGuide?.legalNotes.length).toBeGreaterThan(0);
    expect(config.accessGuide?.emergencyServices.poison_control).toBe(
      'Contact your provincial or territorial poison centre; contact details vary',
    );
    expect(config.recoveryRoadmap?.phases?.length).toBeGreaterThan(0);
  });

  it('resolves config IDs and option labels for every selectable country', async () => {
    for (const countryCode of ['AU', 'CA', 'GB', 'HK', 'IE', 'IN', 'JP', 'KR', 'NZ', 'SG', 'US']) {
      const countryConfig = await loadCountryConfig(countryCode);
      const countryTranslations = await loadCountryTranslations(countryCode, 'en');
      const localized = localizeCountryConfig(countryConfig, countryTranslations);
      expect(localized.formSections.length, countryCode).toBeGreaterThan(0);
      for (const section of localized.formSections) {
        const fields = section.type === 'simple'
          ? section.fields
          : section.type === 'table'
            ? section.columns
            : section.structure.flatMap(subsection => subsection.columns);
        for (const field of fields) {
          if (field.type === 'select') expect(field.options, `${countryCode}.${field.name}`).toBeDefined();
        }
      }
    }
  });
});
