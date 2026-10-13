/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import type { CountryFormConfig } from '../constants/types';
import { addPageFooter } from '../utils/accessGuidePdfHelpers';
import { generateRecoveryRoadmapPDF } from './recoveryRoadmapService';

vi.mock('../utils/accessGuidePdfHelpers', () => ({
  addPageFooter: vi.fn(),
  GUIDE_CONFIG: {
    PAGE_MARGIN: 15,
    THEME_COLOR: [37, 99, 235],
    ACCENT_COLOR: [239, 68, 68],
    SUCCESS_COLOR: [34, 197, 94],
    WARNING_COLOR: [234, 179, 8],
    TEXT_PRIMARY: [30, 41, 59],
    TEXT_SECONDARY: [100, 116, 139],
    HEADER_BG: [241, 245, 249],
  },
}));

const config = {
  countryCode: 'IN', countryName: 'India', currency: 'INR', currencySymbol: 'Rs.', formSections: [],
  recoveryRoadmap: {
    enabled: true,
    legalFramework: ['Succession law'],
    phases: [{
      phase: 1, title: 'Stabilize', timeframe: 'Day 1-30', priority: 'CRITICAL', focus: 'Immediate needs',
      keyActions: [{ step: 1, action: 'Notify family', why: 'Coordinate support', priority: 'HIGH' }],
      mustHaveDocuments: ['Identity documents'],
      keyContacts: [{ entity: 'Bank', number: '100', use: 'Claims', portal: 'bank.test' }, { entity: 'Doctor', use: 'Care' }],
      criticalMistakes: ['Do not share passwords'],
      legalDeadlines: [{ item: 'File claim', deadline: '30 days', consequence: 'Benefits may be delayed' }],
    }],
    quickReference: {
      legalHeirCertificate: { issuedBy: 'Court', timeToObtain: '2 weeks', cost: 'Low', usedFor: ['Bank'], notSuitableFor: 'Property disputes' },
      successionCertificate: { issuedBy: 'Court', timeToObtain: '3 months', cost: 'Medium', usedFor: 'Securities', notSuitableFor: 'General administration' },
      irdaiClaimTimeline: { standardSettlement: '15 days', ifInvestigationNeeded: '90 days', maximumAllowed: '6 months', penaltyForDelay: 'Interest' },
      epfClaimsChecklist: { form20: 'Withdrawal', form10D: 'Pension', form5IF: 'Insurance', helpline: '1800', portal: 'epf.test' },
      probate: { issuedBy: 'Court', mandatory: 'Some regions', timeToObtain: 'Months' },
    },
  },
} as unknown as CountryFormConfig;
const roadmap = (config as any).recoveryRoadmap;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Recovery Roadmap service', () => {
  it('requires the roadmap feature to be enabled', async () => {
    await expect(generateRecoveryRoadmapPDF({ countryConfig: { ...config, recoveryRoadmap: undefined } as any })).rejects.toThrow('Recovery roadmap is not enabled for this country');
  });

  it('generates configured legal, phase, deadline, contact, and quick-reference content', async () => {
    const result = await generateRecoveryRoadmapPDF({ countryConfig: config });
    expect(result).toBeInstanceOf(Blob);
    expect(addPageFooter).toHaveBeenCalled();
  });

  it('handles omitted roadmap sections and optional phase fields', async () => {
    const sparseConfig = {
      ...config,
      countryName: null,
      recoveryRoadmap: {
        ...roadmap,
        legalFramework: [],
        phases: [{
          phase: 2,
          title: 'Claim',
          timeframe: 'Day 30-90',
          priority: 'UNLISTED',
          focus: 'File claims',
          keyActions: [
            { step: 1, action: 'Contact the insurer', priority: 'MEDIUM' },
            { step: 2, action: 'Keep records', priority: 'LOW' },
          ],
          keyContacts: [{ entity: 'Claims office' }],
        }],
        quickReference: {
          legalHeirCertificate: {
            issuedBy: 'Court', timeToObtain: '2 weeks', cost: 'Low',
            usedFor: 'Bank claims', notSuitableFor: 'Property disputes',
          },
          successionCertificate: {
            issuedBy: 'Court', timeToObtain: '3 months', cost: 'Medium',
            usedFor: ['Securities'], notSuitableFor: 'General administration',
          },
        },
      },
    } as unknown as CountryFormConfig;

    const result = await generateRecoveryRoadmapPDF({ countryConfig: sparseConfig });

    expect(result).toBeInstanceOf(Blob);
  });

  it('normalizes non-string country names and handles missing optional pages', async () => {
    for (const countryName of [42, false, undefined, () => undefined]) {
      const countryConfig = {
        ...config,
        countryName,
        recoveryRoadmap: {
          ...roadmap,
          legalFramework: [],
          phases: undefined,
          quickReference: undefined,
        },
      } as unknown as CountryFormConfig;

      await expect(generateRecoveryRoadmapPDF({ countryConfig })).resolves.toBeInstanceOf(Blob);
    }
  });

  it.each([
    [new Error('PDF failure'), 'Failed to generate recovery roadmap: PDF failure'],
    ['unexpected failure', 'Failed to generate recovery roadmap: Unknown error'],
  ])('wraps PDF generation failures when the source throws %s', async (thrown, message) => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const invalidConfig = { ...config } as CountryFormConfig;
    Object.defineProperty(invalidConfig, 'countryName', {
      get: () => { throw thrown; },
    });

    await expect(generateRecoveryRoadmapPDF({ countryConfig: invalidConfig })).rejects.toThrow(message);
    expect(log).toHaveBeenCalledTimes(1);
    log.mockRestore();
  });
});
