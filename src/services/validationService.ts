import type { BaseField } from '../constants/types';

export interface IValidationService {
  validateField(field: BaseField, value: any): string | null;
  validateAllFields(fields: BaseField[], values: Record<string, any>): Record<string, string>;
}

/**
 * Service for field validation
 * Follows Single Responsibility Principle: Only handles validation logic
 */
export class ValidationService implements IValidationService {
  validateField(field: BaseField, value: any): string | null {
    if (!field.validation) return null;

    const validation = field.validation;

    if (validation.required && (!value || value === '')) {
      return validation.errorMessage || `${field.label} is required`;
    }

    if (validation.minLength && value && value.length < validation.minLength) {
      return validation.errorMessage || `${field.label} must be at least ${validation.minLength} characters`;
    }

    if (validation.maxLength && value && value.length > validation.maxLength) {
      return validation.errorMessage || `${field.label} must not exceed ${validation.maxLength} characters`;
    }

    if (validation.min !== undefined && value !== undefined && value < validation.min) {
      return validation.errorMessage || `${field.label} must be at least ${validation.min}`;
    }

    if (validation.max !== undefined && value !== undefined && value > validation.max) {
      return validation.errorMessage || `${field.label} must not exceed ${validation.max}`;
    }

    if (validation.pattern && value) {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        return validation.errorMessage || `${field.label} format is invalid`;
      }
    }

    return null;
  }

  validateAllFields(fields: BaseField[], values: Record<string, any>): Record<string, string> {
    const errors: Record<string, string> = {};
    
    fields.forEach(field => {
      const error = this.validateField(field, values[field.name]);
      if (error) {
        errors[field.name] = error;
      }
    });

    return errors;
  }
}

// Factory function for dependency injection
export const createValidationService = (): IValidationService => {
  return new ValidationService();
};
