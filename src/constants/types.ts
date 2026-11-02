export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  errorMessage?: string;
  errorMessages?: Record<string, string>;
}

export interface BaseField {
  label: string;
  name: string;
  type: 'text' | 'number' | 'email' | 'date' | 'textarea' | 'select';
  placeholder?: string;
  validation?: FieldValidation;
  options?: string[];
  optionKeys?: string[];
  description?: string;
  [key: string]: unknown;
}

export interface SimpleSection {
  id?: string;
  section: string;
  type: 'simple';
  fields: BaseField[];
  description?: string;
  [key: string]: unknown;
}

export interface TableSection {
  id?: string;
  section: string;
  type: 'table';
  columns: BaseField[];
  description?: string;
  minRows?: number;
  maxRows?: number;
  [key: string]: unknown;
}

export interface ComplexSubSection {
  id?: string;
  type: 'table';
  title: string;
  columns: BaseField[];
  minRows?: number;
  maxRows?: number;
  [key: string]: unknown;
}

export interface ComplexSection {
  id?: string;
  section: string;
  type: 'complex';
  structure: ComplexSubSection[];
  description?: string;
  [key: string]: unknown;
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
  officialLinks?: Record<string, unknown>;
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
  phonePrefix?: string;
  formSections: FormSection[];
  accessGuide?: AccessGuideConfig;
  recoveryRoadmap?: RecoveryRoadmapConfig;
  [key: string]: unknown;
}

export interface ConfigField {
  name: string;
  type: BaseField['type'];
  validation?: Omit<FieldValidation, 'errorMessage' | 'errorMessages'>;
  optionKeys?: string[];
  [key: string]: unknown;
}

export interface ConfigFormSection {
  id: string;
  type: 'simple' | 'table' | 'complex';
  fields?: ConfigField[];
  columns?: ConfigField[];
  structure?: Array<{
    id: string;
    type: 'table';
    columns: ConfigField[];
    minRows?: number;
    maxRows?: number;
    [key: string]: unknown;
  }>;
  minRows?: number;
  maxRows?: number;
  [key: string]: unknown;
}

export interface RawCountryFormConfig {
  countryCode: string;
  currency: string;
  currencySymbol: string;
  phonePrefix?: string;
  formSections: ConfigFormSection[];
  accessGuide?: Record<string, unknown>;
  recoveryRoadmap?: Record<string, unknown>;
  [key: string]: unknown;
}
