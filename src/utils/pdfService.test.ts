import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getFormSections } from '../constants';
import type { FormSection } from '../constants/types';
import { addPageNumber, addSectionHeader, generateComplexPDFSection, generateSimplePDFSection, generateTablePDFSection } from './pdfHelpers';
import { downloadPDF, generateFormPDF } from './pdfService';

vi.mock('../constants', () => ({ getFormSections: vi.fn() }));
vi.mock('./pdfHelpers', () => ({
  PDF_CONFIG: { PAGE_MARGIN: 10 },
  addSectionHeader: vi.fn(async (_doc, _section, y) => y + 5),
  generateSimplePDFSection: vi.fn(),
  generateTablePDFSection: vi.fn(),
  generateComplexPDFSection: vi.fn(),
  addPageNumber: vi.fn(),
}));

const field = { name: 'name', label: 'Name', type: 'text' as const };
const sections: FormSection[] = [
  { section: 'Personal', type: 'simple', fields: [field] },
  { section: 'Contacts', type: 'table', columns: [field] },
  { section: 'Estate', type: 'complex', structure: [{ title: 'Trustees', type: 'table', columns: [field] }] },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getFormSections).mockResolvedValue(sections);
});

describe('PDF service', () => {
  it('generates every section kind, including skipped sections and page breaks', async () => {
    const blob = await generateFormPDF({ Personal: { name: 'Ada' }, Contacts: { rows: [{ name: 'Grace' }] } }, 'US', new Set([0]), new Set([1]));
    expect(blob).toBeInstanceOf(Blob);
    expect(addSectionHeader).toHaveBeenCalledTimes(3);
    expect(vi.mocked(generateSimplePDFSection).mock.calls[0][1].section).toBe('Personal');
    expect(vi.mocked(generateSimplePDFSection).mock.calls[0][3]).toEqual({ name: 'Ada' });
    expect(vi.mocked(generateTablePDFSection).mock.calls[0][1].section).toBe('Contacts');
    expect(vi.mocked(generateTablePDFSection).mock.calls[0][3]).toBeUndefined();
    expect(vi.mocked(generateComplexPDFSection).mock.calls[0][1].section).toBe('Estate');
    expect(vi.mocked(generateComplexPDFSection).mock.calls[0][3]).toEqual({});
    expect(addPageNumber).toHaveBeenCalledTimes(3);
  });

  it('wraps errors from configuration or PDF generation', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(getFormSections).mockRejectedValueOnce(new Error('offline'));
    await expect(generateFormPDF({}, 'XX')).rejects.toThrow('Failed to generate PDF. Please try again.');
    expect(log).toHaveBeenCalledWith('Error generating PDF:', expect.any(Error));
  });

  it('downloads a PDF blob and releases its object URL', () => {
    const createObjectURL = vi.fn(() => 'blob:pdf');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    downloadPDF(new Blob(['pdf']), 'CA');
    expect(createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:pdf');
  });
});
