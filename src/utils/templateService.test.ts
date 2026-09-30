import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getFormSections } from '../constants';
import { addPageNumber, addSectionHeader, generateComplexPDFSection, generateSimplePDFSection, generateTablePDFSection } from './pdfHelpers';
import { downloadTemplateAsZip } from './templateService';
import type { FormSection } from '../constants/types';

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
  { section: 'Contacts', type: 'table', columns: [field], maxRows: 2 },
  { section: 'Estate', type: 'complex', structure: [{ title: 'Beneficiaries', type: 'table', columns: [field], maxRows: 2 }] },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getFormSections).mockResolvedValue(sections);
  vi.stubGlobal('URL', class extends URL {
    static createObjectURL = vi.fn(() => 'blob:template');
    static revokeObjectURL = vi.fn();
  });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
});
afterEach(() => vi.unstubAllGlobals());

describe('Template service', () => {
  it('generates Excel and PDF templates and downloads their ZIP package', async () => {
    await downloadTemplateAsZip('IN');
    expect(getFormSections).toHaveBeenCalledWith('IN');
    expect(generateSimplePDFSection).toHaveBeenCalled();
    expect(generateTablePDFSection).toHaveBeenCalled();
    expect(generateComplexPDFSection).toHaveBeenCalled();
    expect(addPageNumber).toHaveBeenCalledTimes(3);
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
    expect(document.querySelector('a')).toBeNull();
  });

  it('wraps configuration or generation failures for the caller', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(getFormSections).mockRejectedValueOnce(new Error('missing config'));
    await expect(downloadTemplateAsZip('XX')).rejects.toThrow('Failed to generate template package. Please try again.');
    expect(log).toHaveBeenCalledWith('Error creating template package:', expect.any(Error));
  });
});
