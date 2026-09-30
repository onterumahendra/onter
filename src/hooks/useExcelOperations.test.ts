import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useExcelOperations } from './useExcelOperations';
import type { IExcelService } from '../services/excelService';

vi.mock('../store/appStore', () => ({
  useAppStore: () => ({
    formData: { personalInfo: { name: 'Asha' } },
    selectedCountry: 'US',
  }),
}));

const mockService: IExcelService = {
  exportData: vi.fn<IExcelService['exportData']>(),
  generateTemplate: vi.fn<IExcelService['generateTemplate']>(),
  importData: vi.fn<IExcelService['importData']>(),
};

describe('useExcelOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates a template successfully', async () => {
    mockService.generateTemplate.mockResolvedValue(undefined);

    const { result } = renderHook(() => useExcelOperations(mockService));

    await act(async () => {
      await result.current.generateTemplate();
    });

    expect(mockService.generateTemplate).toHaveBeenCalledWith('US');
    expect(result.current.isGenerating).toBe(false);
  });

  it('imports data successfully and resolves the payload', async () => {
    mockService.importData.mockResolvedValue({ personalInfo: { name: 'Asha' } });

    const { result } = renderHook(() => useExcelOperations(mockService));

    await act(async () => {
      const payload = await result.current.importData(new File(['test'], 'sample.xlsx'));
      expect(payload).toEqual({ personalInfo: { name: 'Asha' } });
    });

    expect(mockService.importData).toHaveBeenCalledWith(expect.any(File), 'US');
    expect(result.current.isImporting).toBe(false);
  });

  it('exports data and throws when the service fails', async () => {
    mockService.exportData.mockRejectedValue(new Error('Export failed'));

    const { result } = renderHook(() => useExcelOperations(mockService));

    await act(async () => {
      await expect(result.current.exportData()).rejects.toThrow('Export failed');
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe('Export failed');
  });

  it('exports successfully and normalizes non-Error operation failures', async () => {
    mockService.exportData.mockResolvedValue(undefined);
    const { result } = renderHook(() => useExcelOperations(mockService));
    await act(async () => result.current.exportData());
    expect(mockService.exportData).toHaveBeenCalledWith({ personalInfo: { name: 'Asha' } }, 'US');
    expect(result.current.isExporting).toBe(false);

    mockService.exportData.mockRejectedValueOnce('failure');
    await act(async () => {
      await expect(result.current.exportData()).rejects.toThrow('Export failed');
    });
    mockService.generateTemplate.mockRejectedValueOnce('failure');
    await act(async () => {
      await expect(result.current.generateTemplate()).rejects.toThrow('Template generation failed');
    });
    mockService.importData.mockRejectedValueOnce('failure');
    await act(async () => {
      await expect(result.current.importData(new File([], 'bad.xlsx'))).rejects.toThrow('Import failed');
    });
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.isImporting).toBe(false);
  });

  it('captures template generation failures', async () => {
    mockService.generateTemplate.mockRejectedValue(new Error('Template generation failed'));

    const { result } = renderHook(() => useExcelOperations(mockService as any));

    await act(async () => {
      await expect(result.current.generateTemplate()).rejects.toThrow('Template generation failed');
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe('Template generation failed');
  });
});
