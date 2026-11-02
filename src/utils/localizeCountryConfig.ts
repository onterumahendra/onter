import type {
  AccessGuideConfig,
  BaseField,
  ConfigField,
  ConfigFormSection,
  CountryFormConfig,
  RawCountryFormConfig,
} from '../constants/types';
import type { TranslationResource, TranslationValue } from './i18nLoader';

function getValue(resource: TranslationResource, path: string): TranslationValue | undefined {
  return path.split('.').reduce<TranslationValue | undefined>((value, key) => {
    if (Array.isArray(value)) return value[Number(key)];
    if (value && typeof value === 'object') return value[key];
    return undefined;
  }, resource);
}

function getText(resource: TranslationResource, path: string): string {
  const value = getValue(resource, path);
  if (typeof value !== 'string') {
    throw new Error(`Missing translation "${path}"`);
  }
  return value;
}

function getStringMap(resource: TranslationResource, path: string): Record<string, string> {
  const value = getValue(resource, path);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  );
}

function localizeFields(
  fields: ConfigField[] = [],
  sectionId: string,
  kind: 'fields' | 'columns',
  translations: TranslationResource,
): BaseField[] {
  return fields.map(field => {
    const fieldPath = `forms.${sectionId}.${kind}.${field.name}`;
    const fieldText = getValue(translations, fieldPath);
    const fieldTranslations =
      fieldText && typeof fieldText === 'object' && !Array.isArray(fieldText)
        ? fieldText as TranslationResource
        : {};

    const localized: BaseField = {
      ...field,
      name: field.name,
      type: field.type,
      label: typeof fieldTranslations.label === 'string' ? fieldTranslations.label : field.name,
    };

    for (const key of ['placeholder', 'description', 'helpText'] as const) {
      const value = fieldTranslations[key];
      if (typeof value === 'string') localized[key] = value;
    }

    if (field.validation) {
      const errors = getStringMap(translations, `${fieldPath}.errors`);
      localized.validation = {
        ...field.validation,
        ...(Object.keys(errors).length ? { errorMessages: errors } : {}),
      };
    }

    if (field.optionKeys) {
      localized.options = field.optionKeys.map(optionKey =>
        getText(translations, `options.${field.name}.${optionKey}`),
      );
    }

    return localized;
  });
}

function localizeFormSections(
  sections: ConfigFormSection[],
  translations: TranslationResource,
): CountryFormConfig['formSections'] {
  return sections.map(section => {
    const formPath = `forms.${section.id}`;
    const title = getText(translations, `${formPath}.title`);
    const description = getValue(translations, `${formPath}.description`);
    const localized: Record<string, unknown> = {
      ...section,
      id: section.id,
      section: title,
      type: section.type,
    };
    delete localized.fields;
    delete localized.columns;
    delete localized.structure;
    if (typeof description === 'string') localized.description = description;

    if (section.fields) {
      localized.fields = localizeFields(section.fields, section.id, 'fields', translations);
    }
    if (section.columns) {
      localized.columns = localizeFields(section.columns, section.id, 'columns', translations);
    }
    if (section.structure) {
      const subsections = getValue(translations, `${formPath}.subsections`);
      localized.structure = section.structure.map(subsection => {
        const titlePath = `${formPath}.subsections.${subsection.id}.title`;
        const subsectionTitle = getText(translations, titlePath);
        const titleMap =
          subsections && typeof subsections === 'object' && !Array.isArray(subsections)
            ? subsections as TranslationResource
            : {};
        const localizedSubsection: Record<string, unknown> = {
          ...subsection,
          id: subsection.id,
          title: subsectionTitle,
          columns: localizeFields(subsection.columns, section.id, 'columns', translations),
        };
        if (!Object.hasOwn(titleMap, subsection.id)) {
          throw new Error(`Missing translations for complex subsection "${subsection.id}"`);
        }
        return localizedSubsection;
      });
    }

    return localized as CountryFormConfig['formSections'][number];
  });
}

function localizeKeyList(
  keys: unknown,
  translations: TranslationResource,
  path: string,
): string[] {
  if (!Array.isArray(keys)) return [];
  return keys.map(key => {
    if (typeof key !== 'string') throw new Error(`Invalid translation key in "${path}"`);
    return getText(translations, `${path}.${key}`);
  });
}

function localizeAccessGuide(
  guide: Record<string, unknown> | undefined,
  translations: TranslationResource,
): AccessGuideConfig | undefined {
  if (!guide) return undefined;
  const translatedGuide = getValue(translations, 'accessGuide');
  if (!translatedGuide || typeof translatedGuide !== 'object' || Array.isArray(translatedGuide)) {
    throw new Error('Missing access guide translations');
  }
  const guideTranslations = translatedGuide as TranslationResource;

  const sectionGuidance: AccessGuideConfig['sectionGuidance'] = {};
  const configGuidance = guide.sectionGuidance;
  if (configGuidance && typeof configGuidance === 'object') {
    for (const [sectionId, value] of Object.entries(configGuidance)) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
      const configValue = value as Record<string, unknown>;
      const translated = getValue(guideTranslations, `sectionGuidance.${sectionId}`);
      if (!translated || typeof translated !== 'object' || Array.isArray(translated)) {
        throw new Error(`Missing access guide translations for "${sectionId}"`);
      }
      const path = `accessGuide.sectionGuidance.${sectionId}`;
      const translatedValue = translated as TranslationResource;
      const description = translatedValue.description;
      if (typeof description !== 'string') {
        throw new Error(`Missing access guide description for "${sectionId}"`);
      }

      const criticalKeys = configValue.criticalFieldKeys;
      const criticalMap = getStringMap(translations, `${path}.criticalFields`);
      sectionGuidance[sectionId] = {
        description,
        usefulFor: localizeKeyList(configValue.usefulForKeys, translations, `${path}.usefulFor`),
        firstActions: localizeKeyList(configValue.firstActionKeys, translations, `${path}.firstActions`),
        ...(Array.isArray(criticalKeys)
          ? {
              criticalFields: criticalKeys.map(key => {
                if (typeof key !== 'string' || !criticalMap[key]) {
                  throw new Error(`Missing critical field translation for "${sectionId}.${String(key)}"`);
                }
                return criticalMap[key];
              }),
            }
          : {}),
      };
    }
  }

  const emergencyServices = guide.emergencyServices;
  if (!emergencyServices || typeof emergencyServices !== 'object') {
    throw new Error('Missing access guide emergency service data');
  }
  if (typeof guide.enabled !== 'boolean') {
    throw new Error('Missing access guide enabled flag');
  }
  const legalKeys = guide.legalNoteKeys ?? guide.legalNotesKeys;
  const quickStartKeys = guide.quickStartKeys;
  const generalKeys = guide.generalGuidanceKeys;
  const generalGuidance: AccessGuideConfig['generalGuidance'] = {};
  if (generalKeys && typeof generalKeys === 'object') {
    for (const [key, values] of Object.entries(generalKeys)) {
      generalGuidance[key as keyof NonNullable<AccessGuideConfig['generalGuidance']>] =
        localizeKeyList(values, translations, `accessGuide.generalGuidance.${key}`);
    }
  }

  return {
    enabled: guide.enabled,
    quickStart: localizeKeyList(quickStartKeys, translations, 'accessGuide.quickStart'),
    emergencyServices: Object.fromEntries(
      Object.entries(emergencyServices).map(([service, value]) => {
        if (
          value &&
          typeof value === 'object' &&
          !Array.isArray(value) &&
          typeof (value as Record<string, unknown>).$i18n === 'string'
        ) {
          return [service, getText(translations, (value as Record<string, string>).$i18n)];
        }
        if (typeof value !== 'string' && typeof value !== 'number') {
          throw new Error(`Invalid emergency service value for "${service}"`);
        }
        return [service, String(value)];
      }),
    ) as AccessGuideConfig['emergencyServices'],
    ...(guide.officialLinks ? { officialLinks: guide.officialLinks as Record<string, unknown> } : {}),
    sectionGuidance,
    legalNotes: localizeKeyList(legalKeys, translations, 'accessGuide.legalNotes'),
    ...(Object.keys(generalGuidance).length ? { generalGuidance } : {}),
  };
}

function resolveTranslationReferences(value: unknown, translations: TranslationResource): unknown {
  if (Array.isArray(value)) {
    return value.map(item => resolveTranslationReferences(item, translations));
  }
  if (!value || typeof value !== 'object') return value;

  const record = value as Record<string, unknown>;
  if (typeof record.$i18n === 'string' && Object.keys(record).length === 1) {
    return getText(translations, record.$i18n);
  }
  return Object.fromEntries(
    Object.entries(record).map(([key, child]) => [
      key,
      resolveTranslationReferences(child, translations),
    ]),
  );
}

export function localizeCountryConfig(
  config: RawCountryFormConfig,
  translations: TranslationResource,
): CountryFormConfig {
  const countryName = getText(translations, 'countryName');
  const recoveryRoadmap = config.recoveryRoadmap
    ? resolveTranslationReferences(config.recoveryRoadmap, translations) as CountryFormConfig['recoveryRoadmap']
    : undefined;

  return {
    ...config,
    countryName,
    formSections: localizeFormSections(config.formSections, translations),
    accessGuide: localizeAccessGuide(config.accessGuide, translations),
    ...(recoveryRoadmap ? { recoveryRoadmap } : {}),
  };
}
