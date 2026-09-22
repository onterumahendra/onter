import { AVAILABLE_COUNTRIES } from '../constants/countries';

export async function loadPdfImage(src: string): Promise<HTMLImageElement> {
  if (!src) {
    throw new Error('Image source is required');
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    const timeout = setTimeout(() => {
      image.onload = null;
      image.onerror = null;
      reject(new Error(`Image load timeout: ${src}`));
    }, 5000);

    image.crossOrigin = 'anonymous';
    image.onload = () => {
      clearTimeout(timeout);
      if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
        reject(new Error(`Image has invalid dimensions: ${src}`));
        return;
      }
      resolve(image);
    };
    image.onerror = () => {
      clearTimeout(timeout);
      reject(new Error(`Failed to load image: ${src}`));
    };
    image.src = src;
  });
}

export function resolveCountryCode(country: string | null | undefined): string | null {
  const normalizedCountry = country?.trim().toLowerCase();
  if (!normalizedCountry) {
    return null;
  }

  const match = AVAILABLE_COUNTRIES.find(({ code, name }) =>
    code.toLowerCase() === normalizedCountry || name.toLowerCase() === normalizedCountry
  );

  return match?.code.toLowerCase() ?? null;
}

export function rasterizePdfImage(image: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to create image canvas context');
  }

  context.drawImage(image, 0, 0);
  return canvas;
}
