import { useState, useCallback } from 'react';
import { createValidationService, type IValidationService } from '../services/validationService';
import type { BaseField } from '../constants/types';

interface UseFieldValidationResult {
  errors: Record<string, string>;
  validateField: (field: BaseField, value: any) => string | null;
  setFieldError: (fieldName: string, error: string) => void;
  clearFieldError: (fieldName: string) => void;
  clearAllErrors: () => void;
}

/**
 * Hook for field validation
 * Follows Dependency Inversion: Depends on IValidationService interface
 */
export const useFieldValidation = (
  service: IValidationService = createValidationService()
): UseFieldValidationResult => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = useCallback((field: BaseField, value: any): string | null => {
    return service.validateField(field, value);
  }, [service]);

  const setFieldError = useCallback((fieldName: string, error: string) => {
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    validateField,
    setFieldError,
    clearFieldError,
    clearAllErrors
  };
};
