import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { createFormConfigService, type IFormConfigService } from '../services/formConfigService';
import type { FormSection } from '../constants/types';

interface UseFormConfigResult {
  formSections: FormSection[];
  isLoading: boolean;
  error: Error | null;
  reload: () => void;
}

/**
 * Hook for loading form configuration
 * Follows Dependency Inversion: Depends on IFormConfigService interface
 */
export const useFormConfig = (
  service: IFormConfigService = createFormConfigService()
): UseFormConfigResult => {
  const [formSections, setFormSections] = useState<FormSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { selectedCountry } = useAppStore();

  const loadConfig = async () => {
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
  };

  useEffect(() => {
    loadConfig();
  }, [selectedCountry]);

  return {
    formSections,
    isLoading,
    error,
    reload: loadConfig
  };
};
