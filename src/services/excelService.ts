import { exportToExcel as utilExportToExcel, importExcel as utilImportExcel } from '../utils/excel';
import { downloadTemplateAsZip } from '../utils/templateService';

export interface IExcelService {
  exportData(formData: Record<string, any>, countryCode: string): Promise<void>;
  generateTemplate(countryCode: string): Promise<void>;
  importData(file: File, countryCode: string): Promise<Record<string, any>>;
}

/**
 * Service for Excel operations
 * Follows Single Responsibility Principle: Only handles Excel import/export
 */
export class ExcelService implements IExcelService {
  async exportData(formData: Record<string, any>, countryCode: string): Promise<void> {
    try {
      await utilExportToExcel(formData, countryCode);
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }

  async generateTemplate(countryCode: string): Promise<void> {
    try {
      await downloadTemplateAsZip(countryCode);
    } catch (error) {
      console.error('Failed to generate template:', error);
      throw error;
    }
  }

  async importData(file: File, countryCode: string): Promise<Record<string, any>> {
    try {
      return await utilImportExcel(file, countryCode);
    } catch (error) {
      console.error('Failed to import Excel file:', error);
      throw error;
    }
  }
}

// Factory function for dependency injection
export const createExcelService = (): IExcelService => {
  return new ExcelService();
};
