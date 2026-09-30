import { beforeAll, describe, expect, it } from 'vitest';

let BASE_URL: string;
let publicAsset: (path: string) => string;

beforeAll(async () => {
  ({ BASE_URL, publicAsset } = await import('./paths'));
});

describe('publicAsset', () => {
  it('normalizes paths and prepends the base url', () => {
    expect(publicAsset('flags/us.svg')).toBe(`${BASE_URL}flags/us.svg`);
    expect(publicAsset('/flags/us.svg')).toBe(`${BASE_URL}flags/us.svg`);
  });
});
