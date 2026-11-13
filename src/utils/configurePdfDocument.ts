import type { jsPDF } from 'jspdf';
import { brand } from '../branding';
import { getTextDirection } from './localeDirection';
import { publicAsset } from './paths';

async function loadFontAsset(asset: string): Promise<string> {
  const response = await fetch(publicAsset(asset));
  if (!response.ok) {
    throw new Error(`Unable to load configured PDF font "${asset}" (${response.status})`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

export async function configurePdfDocument(doc: jsPDF, locale: string): Promise<void> {
  const isRtl = getTextDirection(locale) === 'rtl';
  doc.setR2L(isRtl);

  const font = brand.rtlPdfFont;
  if (!font) {
    if (isRtl) {
      throw new Error(
        `RTL PDF export for "${locale}" requires a configured brand.rtlPdfFont with regular and bold TTF assets.`,
      );
    }
    return;
  }

  const regularFileName = `${brand.id}-rtl-regular.ttf`;
  const boldFileName = `${brand.id}-rtl-bold.ttf`;
  const [regularFont, boldFont] = await Promise.all([
    loadFontAsset(font.regularAsset),
    loadFontAsset(font.boldAsset),
  ]);

  doc.addFileToVFS(regularFileName, regularFont);
  doc.addFont(regularFileName, font.family, 'normal');
  doc.addFileToVFS(boldFileName, boldFont);
  doc.addFont(boldFileName, font.family, 'bold');
  doc.setFont(font.family, 'normal');
}
