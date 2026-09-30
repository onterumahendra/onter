import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createExcelService, ExcelService } from './excelService';
import { exportToExcel, importExcel } from '../utils/excel';
import { downloadTemplateAsZip } from '../utils/templateService';

vi.mock('../utils/excel', () => ({ exportToExcel: vi.fn(), importExcel: vi.fn() }));
vi.mock('../utils/templateService', () => ({ downloadTemplateAsZip: vi.fn() }));

describe('ExcelService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('delegates export, template, and import operations', async () => {
    vi.mocked(importExcel).mockResolvedValue({ name: 'Ada' });
    const service = createExcelService();
    expect(service).toBeInstanceOf(ExcelService);
    await expect(service.exportData({ name: 'Ada' }, 'US')).resolves.toBeUndefined();
    await expect(service.generateTemplate('US')).resolves.toBeUndefined();
    await expect(service.importData(new File([], 'data.xlsx'), 'US')).resolves.toEqual({ name: 'Ada' });
    expect(exportToExcel).toHaveBeenCalledWith({ name: 'Ada' }, 'US');
    expect(downloadTemplateAsZip).toHaveBeenCalledWith('US');
    expect(importExcel).toHaveBeenCalledWith(expect.any(File), 'US');
  });

  it('logs and rethrows errors from each delegated operation', async () => {
    const error = new Error('operation failed');
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(exportToExcel).mockRejectedValueOnce(error);
    vi.mocked(downloadTemplateAsZip).mockRejectedValueOnce(error);
    vi.mocked(importExcel).mockRejectedValueOnce(error);
    const service = new ExcelService();
    await expect(service.exportData({}, 'IN')).rejects.toBe(error);
    await expect(service.generateTemplate('IN')).rejects.toBe(error);
    await expect(service.importData(new File([], 'data.xlsx'), 'IN')).rejects.toBe(error);
    expect(log).toHaveBeenCalledTimes(3);
    log.mockRestore();
  });
});
