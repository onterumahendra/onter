import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { createExcelService, type IExcelService } from '../services/excelService';

interface UseExcelOperationsResult {
  isExporting: boolean;
  isGenerating: boolean;
  isImporting: boolean;
  exportData: () => Promise<void>;
  generateTemplate: () => Promise<void>;
  importData: (file: File) => Promise<Record<string, any>>;
  error: Error | null;
}

/**
 * Hook for Excel operations
 * Follows Dependency Inversion: Depends on IExcelService interface
 */
export const useExcelOperations = (
  service: IExcelService = createExcelService()
): UseExcelOperationsResult => {
  const [isExporting, setIsExporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { formData, selectedCountry } = useAppStore();

  const exportData = async () => {
    setIsExporting(true);
    setError(null);
    
    try {
      await service.exportData(formData, selectedCountry);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Export failed');
      setError(error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  const generateTemplate = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      await service.generateTemplate(selectedCountry);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Template generation failed');
      setError(error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const importData = async (file: File): Promise<Record<string, any>> => {
    setIsImporting(true);
    setError(null);
    
    try {
      return await service.importData(file, selectedCountry);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Import failed');
      setError(error);
      throw error;
    } finally {
      setIsImporting(false);
    }
  };

  return {
    isExporting,
    isGenerating,
    isImporting,
    exportData,
    generateTemplate,
    importData,
    error
  };
};
