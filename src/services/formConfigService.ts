import { getFormSections, type FormSection } from '../constants';

export interface IFormConfigService {
  loadFormSections(countryCode: string): Promise<FormSection[]>;
}

/**
 * Service for loading form configurations
 * Follows Single Responsibility Principle: Only handles form config loading
 */
export class FormConfigService implements IFormConfigService {
  async loadFormSections(countryCode: string): Promise<FormSection[]> {
    try {
      return await getFormSections(countryCode);
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
