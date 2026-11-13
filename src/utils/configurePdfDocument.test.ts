import { describe, expect, it, vi } from 'vite-plus/test';
import { jsPDF } from 'jspdf';
import { configurePdfDocument } from './configurePdfDocument';

describe('configurePdfDocument', () => {
  it('sets the requested text direction for LTR documents', async () => {
    const doc = new jsPDF();
    const setR2L = vi.spyOn(doc, 'setR2L');

    await configurePdfDocument(doc, 'en');

    expect(setR2L).toHaveBeenCalledWith(false);
  });

  it('fails explicitly when an RTL document has no configured font', async () => {
    const doc = new jsPDF();

    await expect(configurePdfDocument(doc, 'ar')).rejects.toThrow(
      'requires a configured brand.rtlPdfFont',
    );
  });
});
