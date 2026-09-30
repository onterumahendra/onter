import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadPdfImage, rasterizePdfImage, resolveCountryCode } from './pdfImageHelpers';

class MockImage {
  naturalWidth = 20;
  naturalHeight = 10;
  crossOrigin: string | null = null;
  onload: null | (() => void) = null;
  onerror: null | (() => void) = null;
  set src(value: string) {
    if (value === 'error') this.onerror?.();
    else {
      if (value === 'invalid') this.naturalWidth = 0;
      this.onload?.();
    }
  }
}

afterEach(() => vi.unstubAllGlobals());

describe('PDF image helpers', () => {
  it('loads valid images and rejects empty, failed, and dimensionless images', async () => {
    vi.stubGlobal('Image', MockImage);
    await expect(loadPdfImage('logo.png')).resolves.toMatchObject({ naturalWidth: 20, naturalHeight: 10 });
    await expect(loadPdfImage('')).rejects.toThrow('Image source is required');
    await expect(loadPdfImage('error')).rejects.toThrow('Failed to load image: error');
    await expect(loadPdfImage('invalid')).rejects.toThrow('Image has invalid dimensions: invalid');
  });

  it('resolves countries by code or name and returns null for unknown input', () => {
    expect(resolveCountryCode(' US ')).toBe('us');
    expect(resolveCountryCode('India')).toBe('in');
    expect(resolveCountryCode(undefined)).toBeNull();
    expect(resolveCountryCode('Unknown')).toBeNull();
  });

  it('rasterizes images to a canvas and reports unavailable contexts', () => {
    const drawImage = vi.fn();
    const canvas = document.createElement('canvas');
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) =>
      tagName === 'canvas' ? canvas : document.createElementNS('http://www.w3.org/1999/xhtml', tagName) as HTMLElement,
    );
    vi.spyOn(canvas, 'getContext').mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
    const image = { naturalWidth: 40, naturalHeight: 30 } as HTMLImageElement;
    expect(rasterizePdfImage(image)).toBe(canvas);
    expect(canvas.width).toBe(40);
    expect(canvas.height).toBe(30);
    expect(drawImage).toHaveBeenCalledWith(image, 0, 0);

    vi.spyOn(canvas, 'getContext').mockReturnValue(null);
    expect(() => rasterizePdfImage(image)).toThrow('Unable to create image canvas context');
  });
});
