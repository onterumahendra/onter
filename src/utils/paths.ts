export const BASE_URL = import.meta.env.BASE_URL ?? '/';

export function publicAsset(path: string): string {
  const normalizedBase = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
  const normalizedPath = path.replace(/^\/+/, '');
  return `${normalizedBase}${normalizedPath}`;
}
