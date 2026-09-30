import { beforeEach, describe, expect, it, vi } from 'vitest';
import { jsPDF } from 'jspdf';
import { addBulletList, addCoverPage, addInfoBox, addPageFooter, addSectionHeader, addSubsection, GUIDE_CONFIG } from './accessGuidePdfHelpers';

const mocks = vi.hoisted(() => ({ loadPdfImage: vi.fn(), rasterizePdfImage: vi.fn(), resolveCountryCode: vi.fn() }));
vi.mock('./pdfImageHelpers', () => mocks);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.resolveCountryCode.mockReturnValue('us');
  mocks.loadPdfImage.mockResolvedValue({ naturalWidth: 100, naturalHeight: 50 });
  mocks.rasterizePdfImage.mockReturnValue({} as HTMLCanvasElement);
});

describe('access guide PDF helpers', () => {
  it('renders the cover with logo and flag, and falls back when images fail', async () => {
    const pdf = new jsPDF();
    const addImage = vi.spyOn(pdf, 'addImage').mockImplementation(() => pdf);
    await addCoverPage(pdf, 'United States');
    expect(addImage).toHaveBeenCalledTimes(2);

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    mocks.loadPdfImage.mockRejectedValue(new Error('not available'));
    await addCoverPage(new jsPDF(), 'Canada');
    expect(warn).toHaveBeenCalledWith('Failed to add logo to cover page:', expect.any(Error));
  });

  it('draws section headers, wraps bullet lists, and starts new pages when needed', () => {
    const pdf = new jsPDF();
    expect(addSectionHeader(pdf, 'Quick Start', 20)).toBe(35);
    const before = pdf.getNumberOfPages();
    const end = addBulletList(pdf, ['First action', 'Second action'], pdf.internal.pageSize.getHeight() - 20, '*');
    expect(pdf.getNumberOfPages()).toBeGreaterThan(before);
    expect(end).toBeGreaterThan(0);
  });

  it('supports all info-box styles and page-boundary handling', () => {
    const pdf = new jsPDF();
    for (const type of ['info', 'warning', 'success', 'error'] as const) {
      expect(addInfoBox(pdf, type, ['A useful instruction'], 20, type)).toBeGreaterThan(20);
    }
    const previousPages = pdf.getNumberOfPages();
    addInfoBox(pdf, 'Near bottom', ['Important'], pdf.internal.pageSize.getHeight() - 20, 'warning');
    expect(pdf.getNumberOfPages()).toBe(previousPages + 1);
  });

  it('wraps subsections across pages and adds the secure footer', () => {
    const pdf = new jsPDF();
    const y = addSubsection(pdf, 'Details', 'Description text', pdf.internal.pageSize.getHeight() - 10);
    expect(y).toBeGreaterThan(GUIDE_CONFIG.PAGE_MARGIN);
    addPageFooter(pdf, 2);
    expect(pdf.getNumberOfPages()).toBe(2);
  });
});
