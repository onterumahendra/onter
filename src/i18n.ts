import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './i18n/global/en.json';
import { brand } from './branding';

const globalTranslationModules = import.meta.glob('./i18n/global/*.json');
const localeFilenamePattern = /\/([a-z]{2,3}(?:-[A-Z][a-z]{3})?(?:-(?:[A-Z]{2}|[0-9]{3}))?)\.json$/;
const availableLocaleCodes = Object.keys(globalTranslationModules)
  .map((path) => path.match(localeFilenamePattern)?.[1])
  .filter((locale): locale is string => Boolean(locale))
  .sort();

if (!availableLocaleCodes.includes('en')) {
  throw new Error('Missing required English global translations');
}

const localeStorageKey = `brand.${brand.id}.locale`;

function readPreferredLocale(): string {
  try {
    const savedLocale = localStorage.getItem(localeStorageKey);
    return savedLocale && availableLocaleCodes.includes(savedLocale) ? savedLocale : 'en';
  } catch (error) {
    console.warn('Unable to read the saved language preference:', error);
    return 'en';
  }
}

export const initialLocale = readPreferredLocale();
export const availableLocales = availableLocaleCodes;

export function savePreferredLocale(locale: string): void {
  if (!availableLocales.includes(locale)) {
    throw new Error(`Cannot save unsupported locale "${locale}"`);
  }

  try {
    localStorage.setItem(localeStorageKey, locale);
  } catch (error) {
    console.warn('Unable to save the language preference:', error);
  }
}

const resources = {
  en: {
    translation: en
  }
};

export const i18nReady = i18n
  .use(initReactI18next)
  .init({
    resources,
    ns: ['translation', 'country'],
    defaultNS: 'translation',
    lng: initialLocale,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes values
    },
    react: {
      useSuspense: false
    }
  });

export default i18n;
