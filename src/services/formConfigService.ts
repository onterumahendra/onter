import { getFormSections, type FormSection } from '../constants';

export interface IFormConfigService {
  loadFormSections(countryCode: string, language?: string): Promise<FormSection[]>;
}

/**
 * Service for loading form configurations
 * Follows Single Responsibility Principle: Only handles form config loading
 */
export class FormConfigService implements IFormConfigService {
  async loadFormSections(countryCode: string, language?: string): Promise<FormSection[]> {
    try {
      return language === undefined
        ? await getFormSections(countryCode)
        : await getFormSections(countryCode, language);
    } catch (error) {
      console.error(`Failed to load form sections for ${countryCode}:`, error);
      throw error;
    }
  }
}

// Factory function for dependency injection
export const createFormConfigService = (): IFormConfigService => {
  return new FormConfigService();
};
