import i18n, { availableLocales, i18nReady } from '../i18n';

export type TranslationValue =
  | string
  | number
  | boolean
  | null
  | TranslationValue[]
  | { [key: string]: TranslationValue };

export type TranslationResource = Record<string, TranslationValue>;

const globalModules = import.meta.glob<TranslationResource>('../i18n/global/*.json', {
  import: 'default',
});
const countryModules = import.meta.glob<TranslationResource>('../i18n/*_*.json', {
  import: 'default',
});

export function deepMergeTranslations(
  ...resources: Array<TranslationResource | undefined>
): TranslationResource {
  const result: TranslationResource = {};

  for (const resource of resources) {
    if (!resource) continue;
    for (const [key, value] of Object.entries(resource)) {
      const current = result[key];
      if (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        current !== null &&
        typeof current === 'object' &&
        !Array.isArray(current)
      ) {
        result[key] = deepMergeTranslations(
          current as TranslationResource,
          value as TranslationResource,
        );
      } else {
        result[key] = value;
      }
    }
  }

  return result;
}

async function loadOptional(
  modules: Record<string, () => Promise<TranslationResource>>,
  modulePath: string,
): Promise<TranslationResource | undefined> {
  const load = modules[modulePath];
  return load ? load() : undefined;
}

export async function loadCountryTranslations(
  countryCode: string,
  language = i18n.language || 'en',
): Promise<TranslationResource> {
  await i18nReady;

  if (!/^[A-Z]{2}$/.test(countryCode)) {
    throw new Error(`Invalid country code for translations: ${countryCode}`);
  }
  if (!/^[a-z]{2,3}(?:-[A-Z][a-z]{3})?(?:-(?:[A-Z]{2}|[0-9]{3}))?$/.test(language)) {
    throw new Error(`Invalid language code: ${language}`);
  }
  if (!availableLocales.includes(language)) {
    throw new Error(`No global translations are available for language "${language}"`);
  }

  const english = await loadOptional(globalModules, '../i18n/global/en.json');
  if (!english) throw new Error('Missing required English global translations');

  const [globalLanguage, countryEnglish, countryLanguage] = await Promise.all([
    language === 'en'
      ? undefined
      : loadOptional(globalModules, `../i18n/global/${language}.json`),
    language === 'en'
      ? undefined
      : loadOptional(countryModules, `../i18n/${countryCode}_en.json`),
    loadOptional(countryModules, `../i18n/${countryCode}_${language}.json`),
  ]);
  const merged = deepMergeTranslations(english, globalLanguage, countryEnglish, countryLanguage);

  i18n.addResourceBundle(language, 'translation', globalLanguage ?? english, true, true);
  i18n.removeResourceBundle(language, 'country');
  i18n.addResourceBundle(language, 'country', merged, true, true);
  if (i18n.language !== language) await i18n.changeLanguage(language);

  return merged;
}
