export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  errorMessage?: string;
}

export interface BaseField {
  label: string;
  name: string;
  type: 'text' | 'number' | 'email' | 'date' | 'textarea' | 'select';
  placeholder?: string;
  validation?: FieldValidation;
  options?: string[];
}

export interface SimpleSection {
  section: string;
  type: 'simple';
  fields: BaseField[];
  description?: string;
}

export interface TableSection {
  section: string;
  type: 'table';
  columns: BaseField[];
  description?: string;
  minRows?: number;
  maxRows?: number;
}

export interface ComplexSubSection {
  type: 'table';
  title: string;
  columns: BaseField[];
  minRows?: number;
  maxRows?: number;
}

export interface ComplexSection {
  section: string;
  type: 'complex';
  structure: ComplexSubSection[];
  description?: string;
}

export type FormSection = SimpleSection | TableSection | ComplexSection;

export interface SectionGuidance {
  description: string;
  usefulFor: string[];
  firstActions: string[];
  criticalFields?: string[];
}

export interface AccessGuideConfig {
  enabled: boolean;
  quickStart: string[];
  emergencyServices: {
    medical: string;
    police: string;
    fire: string;
    [key: string]: string;
  };
  sectionGuidance: Record<string, SectionGuidance>;
  legalNotes: string[];
  generalGuidance?: {
    fileStructure?: string[];
    dataAccess?: string[];
    securityTips?: string[];
  };
}

export type RecoveryRoadmapPriority = 'do-first' | 'do-soon' | 'when-ready';
export type RecoveryRoadmapReviewStatus = 'needs-legal-review';
export type RecoveryRoadmapDeadlineType = 'legal' | 'target' | 'recommended';

export interface RecoveryRoadmapMeta {
  title?: string;
  version?: string;
  lastReviewed?: string;
  reviewedBy?: string;
  generatedOn?: string;
}

export interface RecoveryRoadmapIntro {
  condolence?: string;
  howToUse?: string;
}

export interface RecoveryRoadmapAction {
  step?: number;
  action?: string;
  priority?: RecoveryRoadmapPriority;
  why?: string;
  legalRef?: string;
  reviewStatus?: RecoveryRoadmapReviewStatus;
  [key: string]: unknown;
}

export interface RecoveryRoadmapContact {
  entity?: string;
  name?: string;
  phone?: string;
  number?: string;
  url?: string;
  portal?: string;
  use?: string;
  verified?: boolean;
  reviewStatus?: RecoveryRoadmapReviewStatus;
  [key: string]: unknown;
}

export interface RecoveryRoadmapDeadline {
  item?: string;
  deadline?: string;
  consequence?: string;
  type?: RecoveryRoadmapDeadlineType;
  reviewStatus?: RecoveryRoadmapReviewStatus;
  [key: string]: unknown;
}

export interface RecoveryRoadmapGlossaryEntry {
  term?: string;
  definition?: string;
}

export interface RecoveryRoadmapPhase {
  phase?: number;
  title?: string;
  timeframe?: string;
  priority?: RecoveryRoadmapPriority;
  focus?: string;
  keyActions?: RecoveryRoadmapAction[];
  mustHaveDocuments?: string[];
  keyContacts?: RecoveryRoadmapContact[];
  criticalMistakes?: string[];
  legalDeadlines?: RecoveryRoadmapDeadline[];
  [key: string]: unknown;
}

export interface RecoveryRoadmapConfig {
  enabled?: boolean;
  description?: string;
  meta?: RecoveryRoadmapMeta;
  intro?: RecoveryRoadmapIntro;
  startHere?: string[];
  legalFramework?: string[];
  phases?: RecoveryRoadmapPhase[];
  quickReference?: Record<string, unknown>;
  glossary?: RecoveryRoadmapGlossaryEntry[];
  [key: string]: unknown;
}

export interface CountryFormConfig {
  countryCode: string;
  countryName: string;
  currency: string;
  currencySymbol: string;
  formSections: FormSection[];
  accessGuide?: AccessGuideConfig;
  recoveryRoadmap?: RecoveryRoadmapConfig;
}
