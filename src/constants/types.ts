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

export interface CountryFormConfig {
  countryCode: string;
  countryName: string;
  currency: string;
  currencySymbol: string;
  formSections: FormSection[];
}
