import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CountryFormConfig } from '../constants/types';
import { generateAccessGuidePDF } from './accessGuideService';

const pdfHelpers = vi.hoisted(() => ({
  addCoverPage: vi.fn(),
  addSectionHeader: vi.fn((_doc: any, _title: string, y: number) => y + 10),
  addBulletList: vi.fn((_doc: any, _items: string[], y: number) => y + 10),
  addInfoBox: vi.fn((_doc: any, _title: string, _items: string[], y: number) => y + 10),
  addSubsection: vi.fn((_doc: any, _title: string, _description: string, y: number) => y + 10),
  addPageFooter: vi.fn(),
}));
vi.mock('../utils/accessGuidePdfHelpers', () => ({
  GUIDE_CONFIG: {
    PAGE_MARGIN: 15,
    THEME_COLOR: [37, 99, 235],
    ACCENT_COLOR: [239, 68, 68],
    SUCCESS_COLOR: [34, 197, 94],
    WARNING_COLOR: [234, 179, 8],
    TEXT_PRIMARY: [30, 41, 59],
    TEXT_SECONDARY: [100, 116, 139],
    HEADER_BG: [241, 245, 249],
  },
  ...pdfHelpers,
}));

const config: CountryFormConfig = {
  countryCode: 'US', countryName: 'United States', currency: 'USD', currencySymbol: '$',
  formSections: [
    { section: 'Contacts', type: 'table', description: 'People to call', columns: [] },
    { section: 'Documents', type: 'simple', fields: [] },
  ],
  accessGuide: {
    enabled: true,
    quickStart: ['Call family'],
    emergencyServices: { medical: '911', police: '911', fire: '911' },
    sectionGuidance: {
      Contacts: { description: 'Contact details', usefulFor: ['Family'], firstActions: ['Call'], criticalFields: ['Phone'] },
    },
    legalNotes: ['Seek advice'],
    generalGuidance: { fileStructure: ['Workbook'], dataAccess: ['Open files'], securityTips: ['Keep secure'] },
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  pdfHelpers.addCoverPage.mockResolvedValue(undefined);
  pdfHelpers.addSectionHeader.mockImplementation((_doc, _title, y) => y + 10);
  pdfHelpers.addBulletList.mockImplementation((_doc, _items, y) => y + 10);
  pdfHelpers.addInfoBox.mockImplementation((_doc, _title, _items, y) => y + 10);
  pdfHelpers.addSubsection.mockImplementation((_doc, _title, _description, y) => y + 10);
});

describe('Access Guide service', () => {
  it('requires an enabled country access guide', async () => {
    await expect(generateAccessGuidePDF({ countryConfig: null as unknown as CountryFormConfig })).rejects.toThrow('Country configuration is required');
    await expect(generateAccessGuidePDF({ countryConfig: { ...config, accessGuide: undefined } })).rejects.toThrow('Access guide is not enabled for this country');
  });

  it('generates a guide with configured sections and sanitized contact data', async () => {
    const result = await generateAccessGuidePDF({
      countryConfig: config,
      formData: {
        Contacts: { rows: [{ name: '<b>Ada</b>', phone: '555\n123', ignored: '' }, { note: 'not a contact' }] },
        Personal: { emergencyContact: 'Grace <script>', unrelated: 'skip' },
      },
    });
    expect(result).toBeInstanceOf(Blob);
    expect(pdfHelpers.addCoverPage).toHaveBeenCalledWith(expect.anything(), 'United States');
    const contactItems = pdfHelpers.addInfoBox.mock.calls
      .map((call) => call[2] as string[])
      .find((items) => items.some((item) => item.includes('Contacts #1')));
    expect(contactItems?.[0]).toContain('Ada');
    expect(pdfHelpers.addSubsection).toHaveBeenCalledWith(expect.anything(), 'Contacts', 'Contact details', expect.any(Number));
    expect(pdfHelpers.addPageFooter).toHaveBeenCalled();
  });

  it('uses defaults, omits contact pages when data is excluded, and wraps generation failures', async () => {
    const minimal = { ...config, accessGuide: { enabled: true } } as CountryFormConfig;
    const blob = await generateAccessGuidePDF({ countryConfig: minimal, includeData: false, formData: { Contacts: { emergency: '911' } } });
    expect(blob).toBeInstanceOf(Blob);
    expect(pdfHelpers.addInfoBox).toHaveBeenCalled();
    expect(pdfHelpers.addSectionHeader).toHaveBeenCalledWith(expect.anything(), expect.any(String), expect.any(Number));

    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    pdfHelpers.addCoverPage.mockRejectedValueOnce('cover failed');
    await expect(generateAccessGuidePDF({ countryConfig: config })).rejects.toThrow('Failed to generate access guide: Unknown error');
    expect(log).toHaveBeenCalled();
  });
});
