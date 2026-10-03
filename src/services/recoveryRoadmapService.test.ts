import { beforeEach, describe, expect, it, vi } from 'vitest';
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

//   it('wraps PDF generation failures with a useful error', async () => {
//     const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
//     const invalidConfig = { ...config, countryName: Symbol('invalid') } as unknown as CountryFormConfig;
//     await expect(generateRecoveryRoadmapPDF({ countryConfig: invalidConfig })).rejects.toThrow('Failed to generate recovery roadmap:');
//     expect(log).toHaveBeenCalled();
//   });
});
