/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BaseField } from '../constants/types';
import i18n from 'i18next';

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
    const customMessage = (
      rule: string,
      fallbackKey: string,
      fallbackMessage: string,
      params?: Record<string, unknown>,
    ) => {
      const configuredMessage =
        validation.errorMessages?.[rule] ??
        validation.errorMessages?.default ??
        validation.errorMessage;
      if (configuredMessage) return configuredMessage;
      if (!i18n.isInitialized) return fallbackMessage;
      const translated = i18n.t(fallbackKey, {
        field: field.label,
        ...params,
        defaultValue: fallbackMessage,
      });
      return typeof translated === 'string' ? translated : fallbackMessage;
    };

    if (validation.required && (!value || value === '')) {
      return customMessage('required', 'validation.fieldRequired', `${field.label} is required`);
    }

    if (validation.minLength && value && value.length < validation.minLength) {
      return customMessage(
        'minLength',
        'validation.fieldMinLength',
        `${field.label} must be at least ${validation.minLength} characters`,
        { min: validation.minLength },
      );
    }

    if (validation.maxLength && value && value.length > validation.maxLength) {
      return customMessage(
        'maxLength',
        'validation.fieldMaxLength',
        `${field.label} must not exceed ${validation.maxLength} characters`,
        { max: validation.maxLength },
      );
    }

    if (validation.min !== undefined && value !== undefined && value < validation.min) {
      return customMessage(
        'min',
        'validation.fieldMinValue',
        `${field.label} must be at least ${validation.min}`,
        { min: validation.min },
      );
    }

    if (validation.max !== undefined && value !== undefined && value > validation.max) {
      return customMessage(
        'max',
        'validation.fieldMaxValue',
        `${field.label} must not exceed ${validation.max}`,
        { max: validation.max },
      );
    }

    if (validation.pattern && value) {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        return customMessage('pattern', 'validation.fieldInvalidFormat', `${field.label} format is invalid`);
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
