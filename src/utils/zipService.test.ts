import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getFormConfig, getFormSections } from '../constants';
import { downloadFormAsZip } from './zipService';
import type { CountryFormConfig, FormSection } from '../constants/types';

const mocks = vi.hoisted(() => {
  const zip = { file: vi.fn(), generateAsync: vi.fn() };
  function ZipConstructor(this: any) {
    this.file = zip.file;
    this.generateAsync = zip.generateAsync;
  }
  return {
    zip,
    ZipConstructor: vi.fn(ZipConstructor),
    aoaToSheet: vi.fn((data: unknown[]) => ({ data })),
    jsonToSheet: vi.fn((data: unknown[]) => ({ data })),
    bookNew: vi.fn(() => ({ SheetNames: [], Sheets: {} })),
    appendSheet: vi.fn(),
    write: vi.fn(() => new Uint8Array([1, 2, 3]).buffer),
    generateFormPDF: vi.fn(),
    generateAccessGuidePDF: vi.fn(),
    generateRecoveryRoadmapPDF: vi.fn(),
  };
});
vi.mock('jszip', () => ({ default: mocks.ZipConstructor }));
vi.mock('xlsx', () => ({
  utils: {
    book_new: mocks.bookNew,
    aoa_to_sheet: mocks.aoaToSheet,
    json_to_sheet: mocks.jsonToSheet,
    book_append_sheet: mocks.appendSheet,
  },
  write: mocks.write,
}));
vi.mock('../constants', () => ({ getFormConfig: vi.fn(), getFormSections: vi.fn() }));
vi.mock('./pdfService', () => ({ generateFormPDF: mocks.generateFormPDF }));
vi.mock('../services/accessGuideService', () => ({ generateAccessGuidePDF: mocks.generateAccessGuidePDF }));
vi.mock('../services/recoveryRoadmapService', () => ({ generateRecoveryRoadmapPDF: mocks.generateRecoveryRoadmapPDF }));

const field = { name: 'name', label: 'Name', type: 'text' as const };
const sections: FormSection[] = [
  { section: 'Personal', type: 'simple', fields: [field] },
  { section: 'Contacts', type: 'table', columns: [field], maxRows: 2 },
  { section: 'Estate', type: 'complex', structure: [{ title: 'Trustees', type: 'table', columns: [field], maxRows: 2 }] },
];
const countryConfig = (extras: object = {}): CountryFormConfig => ({
  countryCode: 'US', countryName: 'United States', currency: 'USD', currencySymbol: '$', formSections: [], ...extras,
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.zip.file.mockReset();
  mocks.zip.generateAsync.mockResolvedValue(new Blob(['zip']));
  mocks.generateFormPDF.mockResolvedValue(new Blob(['pdf']));
  mocks.generateAccessGuidePDF.mockResolvedValue(new Blob(['guide']));
  mocks.generateRecoveryRoadmapPDF.mockResolvedValue(new Blob(['roadmap']));
  mocks.bookNew.mockImplementation(() => ({ SheetNames: [], Sheets: {} }));
  mocks.aoaToSheet.mockImplementation((data: unknown[]) => ({ data }));
  mocks.jsonToSheet.mockImplementation((data: unknown[]) => ({ data }));
  vi.mocked(getFormSections).mockResolvedValue(sections);
  vi.mocked(getFormConfig).mockResolvedValue(countryConfig());
  vi.stubGlobal('URL', class extends URL {
    static createObjectURL = vi.fn(() => 'blob:archive');
    static revokeObjectURL = vi.fn();
  });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
});

afterEach(() => vi.unstubAllGlobals());

describe('ZIP export service', () => {
  it('packages Excel and PDF and downloads when optional guides are disabled', async () => {
    await downloadFormAsZip({ Personal: { name: 'Ada' }, Contacts: { rows: [] } }, 'US', new Set([0]));
    expect(mocks.zip.file).toHaveBeenCalledTimes(2);
    expect(mocks.generateFormPDF).toHaveBeenCalledWith(expect.any(Object), 'US', expect.any(Set), expect.any(Set));
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
    expect(document.querySelector('a')).toBeNull();
    expect(vi.mocked(getFormConfig)).toHaveBeenCalledWith('US');
  });

  it('includes enabled guide and roadmap PDFs', async () => {
    vi.mocked(getFormConfig).mockResolvedValue(countryConfig({ accessGuide: { enabled: true }, recoveryRoadmap: { enabled: true } } as any));
    await downloadFormAsZip({ Personal: { name: 'Grace' } }, 'US');
    expect(mocks.generateAccessGuidePDF).toHaveBeenCalled();
    expect(mocks.generateRecoveryRoadmapPDF).toHaveBeenCalled();
    expect(mocks.zip.file).toHaveBeenCalledTimes(4);
  });

  it('continues when supplementary PDFs fail and wraps core export failures', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(getFormConfig).mockResolvedValue(countryConfig({ accessGuide: { enabled: true }, recoveryRoadmap: { enabled: true } } as any));
    mocks.generateAccessGuidePDF.mockRejectedValueOnce(new Error('guide failed'));
    mocks.generateRecoveryRoadmapPDF.mockRejectedValueOnce(new Error('roadmap failed'));
    await expect(downloadFormAsZip({}, 'US')).resolves.toBeUndefined();
    expect(mocks.zip.file).toHaveBeenCalledTimes(2);

    vi.mocked(getFormConfig).mockRejectedValueOnce(new Error('config failed'));
    await expect(downloadFormAsZip({}, 'US')).rejects.toThrow('Failed to create export package. Please try again.');
    expect(log).toHaveBeenCalled();
  });
});
