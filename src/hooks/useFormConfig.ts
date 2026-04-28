import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { createFormConfigService, type IFormConfigService } from '../services/formConfigService';
import type { FormSection } from '../constants/types';

interface UseFormConfigResult {
  formSections: FormSection[];
  isLoading: boolean;
  error: Error | null;
  reload: () => void;
}

// Create singleton service instance to avoid recreation
const defaultService = createFormConfigService();

/**
 * Hook for loading form configuration
 * Follows Dependency Inversion: Depends on IFormConfigService interface
 */
export const useFormConfig = (
  service: IFormConfigService = defaultService
): UseFormConfigResult => {
  const [formSections, setFormSections] = useState<FormSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { selectedCountry } = useAppStore();

  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const sections = await service.loadFormSections(selectedCountry);
      setFormSections(sections);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load form configuration'));
    } finally {
      setIsLoading(false);
    }
  }, [selectedCountry, service]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return {
    formSections,
    isLoading,
    error,
    reload: loadConfig
  };
};
