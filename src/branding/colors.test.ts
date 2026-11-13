import { describe, expect, it } from 'vite-plus/test';
import { hexToRgb } from './colors';

describe('hexToRgb', () => {
  it('converts six-digit hex colors to RGB values', () => {
    expect(hexToRgb('#2563EB')).toEqual([37, 99, 235]);
  });

  it('rejects unsupported color formats', () => {
    expect(() => hexToRgb('#abc')).toThrow('Invalid six-digit hex color');
  });
});
