import { beforeEach, describe, expect, it, vi } from 'vitest';
import { jsPDF } from 'jspdf';
import type { FormSection } from '../constants/types';
import { addPageNumber, addSectionHeader, generateComplexPDFSection, generateSimplePDFSection, generateTablePDFSection } from './pdfHelpers';

const mocks = vi.hoisted(() => ({
  autoTable: vi.fn(),
  loadPdfImage: vi.fn(),
  rasterizePdfImage: vi.fn(),
  resolveCountryCode: vi.fn(),
}));
vi.mock('jspdf-autotable', () => ({ default: mocks.autoTable }));
vi.mock('./pdfImageHelpers', () => ({
  loadPdfImage: mocks.loadPdfImage,
  rasterizePdfImage: mocks.rasterizePdfImage,
  resolveCountryCode: mocks.resolveCountryCode,
}));

const doc = () => new jsPDF();
const field = { name: 'name', label: 'Name', type: 'text' as const };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.autoTable.mockImplementation((pdf: any, options: any) => {
    pdf.lastAutoTable = { finalY: options.startY + 20 };
  });
  mocks.resolveCountryCode.mockReturnValue(null);
  mocks.rasterizePdfImage.mockReturnValue({} as HTMLCanvasElement);
});

describe('PDF helpers', () => {
  it('renders simple data and the table template/data row variants', () => {
    const pdf = doc();
    generateSimplePDFSection(pdf, { section: 'Personal', type: 'simple', fields: [field] }, 20, { name: 'Ada' });
    generateTablePDFSection(pdf, { section: 'Contacts', type: 'table', columns: [field], maxRows: 2, minRows: 3 }, 30);
    generateTablePDFSection(pdf, { section: 'Contacts', type: 'table', columns: [field], maxRows: 3 }, 30, [{ name: 'Grace' }]);
    expect(mocks.autoTable).toHaveBeenCalledTimes(3);
    expect(mocks.autoTable.mock.calls[0][1].body).toEqual([['Name', 'Ada']]);
    expect(mocks.autoTable.mock.calls[1][1].body).toHaveLength(3);
    expect(mocks.autoTable.mock.calls[2][1].body).toEqual([['Grace'], [''], ['']]);
  });

  it('renders complex subsection templates/data and paginates long subsections', () => {
    const pdf = doc();
    mocks.autoTable.mockImplementation((target: any, options: any) => {
      target.lastAutoTable = { finalY: options.startY + 800 };
    });
    const section = {
      section: 'Estate', type: 'complex' as const,
      structure: [
        { title: 'Beneficiaries', type: 'table' as const, columns: [field], maxRows: 1 },
        { title: 'Trustees', type: 'table' as const, columns: [field], maxRows: 2 },
      ],
    };
    generateComplexPDFSection(pdf, section, 20, { Beneficiaries: [{ name: 'Ada' }], Trustees: [] });
    expect(mocks.autoTable).toHaveBeenCalledTimes(2);
    expect(mocks.autoTable.mock.calls[0][1].body).toEqual([['Ada']]);
    expect(mocks.autoTable.mock.calls[1][1].body).toHaveLength(2);
    expect(pdf.getNumberOfPages()).toBe(2);
  });

  it('adds a logo and optional country flag to section headers', async () => {
    const pdf = doc();
    const image = { naturalWidth: 100, naturalHeight: 50 } as HTMLImageElement;
    mocks.loadPdfImage.mockResolvedValue(image);
    mocks.resolveCountryCode.mockReturnValue('us');
    const addImage = vi.spyOn(pdf, 'addImage').mockImplementation(() => pdf);
    const y = await addSectionHeader(pdf, { section: 'Personal', type: 'simple', fields: [] }, 30, 'US');
    expect(y).toBe(35);
    expect(addImage).toHaveBeenCalledTimes(2);
    expect(mocks.rasterizePdfImage).toHaveBeenCalledWith(image);
  });

//   it('continues without a logo when image loading fails and adds page numbers', async () => {
//     const pdf = doc();
//     const text = vi.spyOn(pdf, 'text');
//     mocks.loadPdfImage.mockRejectedValue(new Error('missing image'));
//     const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
//     await expect(addSectionHeader(pdf, { section: 'Personal', type: 'simple', fields: [] }, 10)).resolves.toBe(15);
//     addPageNumber(pdf, 2, 4);
//     expect(warn).toHaveBeenCalled();
//     expect(text).toHaveBeenCalledWith('Page 2 of 4', expect.any(Number), expect.any(Number), { align: 'center' });
//   });
});
