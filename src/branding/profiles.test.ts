import { describe, expect, it } from 'vite-plus/test';
import { resolveBrandProfile } from './profiles';

describe('brand profiles', () => {
  it('uses the Onter profile by default and exposes the theme palette', () => {
    const profile = resolveBrandProfile();

    expect(profile.id).toBe('onter');
    expect(profile.primaryPalette[5]).toBe('#2563EB');
    expect(profile.accentPalette[5]).toBe('#14B8A6');
  });

  it('rejects unknown build-time brand ids', () => {
    expect(() => resolveBrandProfile('unknown-vendor')).toThrow('Unknown brand profile');
  });
});
