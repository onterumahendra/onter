import { describe, expect, it } from 'vite-plus/test';
import { deepMergeTranslations, loadCountryTranslations } from './i18nLoader';

describe('i18nLoader', () => {
  it('deep-merges translations in fallback precedence order', () => {
    expect(
      deepMergeTranslations(
        { forms: { title: 'English', fields: { name: 'Name' } }, list: ['first', 'second'] },
        { forms: { title: 'French' }, list: ['premier'] },
        { forms: { fields: { name: 'Nom' } } },
      ),
    ).toEqual({
      forms: { title: 'French', fields: { name: 'Nom' } },
      list: ['premier'],
    });
  });

  it('loads the country delta over shared English strings', async () => {
    const translations = await loadCountryTranslations('CA', 'en');

    expect(translations.countryName).toBe('Canada');
    expect(translations.forms).toMatchObject({
      personalDetails: {
        title: 'Personal Details',
        fields: {
          sin: { label: 'Social Insurance Number (SIN)' },
          full_name: { errors: { required: 'Full legal name is required' } },
        },
      },
    });
    expect(translations.options).toMatchObject({
      province_territory: { AB: 'Alberta', BC: 'British Columbia' },
    });
  });
});
