export type TextDirection = 'ltr' | 'rtl';

const rtlLanguages = new Set([
  'ar', 'arc', 'ckb', 'dv', 'fa', 'he', 'iw', 'ji', 'ks', 'ku', 'nqo',
  'pnb', 'ps', 'sd', 'syr', 'ug', 'ur', 'yi',
]);

const rtlScripts = new Set([
  'Adlm', 'Arab', 'Armi', 'Avst', 'Chrs', 'Elym', 'Hatr', 'Hebr',
  'Mand', 'Mend', 'Nkoo', 'Nbat', 'Palm', 'Phli', 'Phlp', 'Prti',
  'Rohg', 'Samr', 'Sogd', 'Sogo', 'Syrc', 'Thaa', 'Yezi',
]);

export function getTextDirection(locale: string): TextDirection {
  const [language = '', ...subtags] = locale.replaceAll('_', '-').split('-');
  const script = subtags.find((part) => /^[A-Za-z]{4}$/.test(part));

  if (script) {
    const normalizedScript = `${script[0].toUpperCase()}${script.slice(1).toLowerCase()}`;
    return rtlScripts.has(normalizedScript) ? 'rtl' : 'ltr';
  }

  return rtlLanguages.has(language.toLowerCase()) ? 'rtl' : 'ltr';
}

export function setDocumentLocale(locale: string): void {
  document.documentElement.lang = locale;
  document.documentElement.dir = getTextDirection(locale);
}
