import { useState } from 'react';
import { Select, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/appStore';
import i18n, { availableLocales, savePreferredLocale } from '../i18n';
import { loadCountryTranslations } from '../utils/i18nLoader';

const languageNames = new Intl.DisplayNames(['en'], { type: 'language' });

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const selectedCountry = useAppStore((state) => state.selectedCountry);
  const [error, setError] = useState<string | null>(null);

  if (availableLocales.length < 2) return null;

  const language = i18n.resolvedLanguage || i18n.language;
  const value = availableLocales.includes(language)
    ? language
    : availableLocales.find((locale) => locale === language.split('-')[0]) || availableLocales[0];

  const handleChange = async (nextLanguage: string) => {
    setError(null);
    try {
      await loadCountryTranslations(selectedCountry, nextLanguage);
      savePreferredLocale(nextLanguage);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : t('app.languageChangeFailed');
      console.error('Failed to change application language:', cause);
      setError(message);
    }
  };

  return (
    <div className="language-switcher">
      <Select
        label={t('app.language')}
        data={availableLocales.map((locale) => ({
          value: locale,
          label: languageNames.of(locale) || locale,
        }))}
        value={value}
        onChange={(nextLanguage) => {
          if (nextLanguage) void handleChange(nextLanguage);
        }}
        allowDeselect={false}
        size="sm"
        aria-label={t('app.language')}
      />
      {error && <Text role="alert" size="xs" c="red.7">{error}</Text>}
    </div>
  );
}
