import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getFormSections } from '../constants';
import type { FormSection } from '../constants/types';
import { exportToExcel, generateSampleExcel, importExcel } from './excel';

const xlsx = vi.hoisted(() => ({
  bookNew: vi.fn(() => ({ SheetNames: [] as string[], Sheets: {} as Record<string, any> })),
  aoaToSheet: vi.fn((data: any[]) => ({ data })),
  jsonToSheet: vi.fn((data: any[]) => ({ data })),
  appendSheet: vi.fn((workbook: any, sheet: any, name: string) => {
    workbook.SheetNames.push(name);
    workbook.Sheets[name] = sheet;
  }),
  writeFile: vi.fn(),
  read: vi.fn(),
  sheetToJson: vi.fn(),
}));
vi.mock('xlsx', () => ({
  utils: {
    book_new: xlsx.bookNew,
    aoa_to_sheet: xlsx.aoaToSheet,
    json_to_sheet: xlsx.jsonToSheet,
    book_append_sheet: xlsx.appendSheet,
    sheet_to_json: xlsx.sheetToJson,
  },
  writeFile: xlsx.writeFile,
  read: xlsx.read,
}));
vi.mock('../constants', () => ({ getFormSections: vi.fn() }));

const column = { name: 'name', label: 'Name', type: 'text' as const };
const sections: FormSection[] = [
  { section: 'Personal', type: 'simple', fields: [column] },
  { section: 'Contacts', type: 'table', columns: [column], maxRows: 2 },
  { section: 'Legal', type: 'complex', structure: [{ title: 'Beneficiaries', type: 'table', columns: [column] }] },
];

beforeEach(() => {
  vi.clearAllMocks();
  xlsx.bookNew.mockImplementation(() => ({ SheetNames: [], Sheets: {} }));
  xlsx.aoaToSheet.mockImplementation((data: any[]) => ({ data }));
  xlsx.jsonToSheet.mockImplementation((data: any[]) => ({ data }));
  xlsx.appendSheet.mockImplementation((workbook: any, sheet: any, name: string) => {
    workbook.SheetNames.push(name);
    workbook.Sheets[name] = sheet;
  });
  vi.mocked(getFormSections).mockResolvedValue(sections);
});

describe('Excel utilities', () => {
  it('generates a sample workbook with simple, table, and complex sheets', async () => {
    await generateSampleExcel('US');
    expect(xlsx.appendSheet).toHaveBeenCalledTimes(3);
    expect(xlsx.writeFile).toHaveBeenCalledWith(expect.any(Object), expect.stringMatching(/^Onter_Care_US_.*\.xlsx$/));
    expect(xlsx.aoaToSheet).toHaveBeenCalledWith([['Name'], ['']]);
  });

  it('imports and sanitizes simple, table, and nested complex data while dropping empty rows', async () => {
    xlsx.read.mockReturnValue({
      SheetNames: ['Personal', 'Contacts', 'Beneficiaries'],
      Sheets: { Personal: {}, Contacts: {}, Beneficiaries: {} },
    });
    xlsx.sheetToJson
      .mockReturnValueOnce([{ Name: '<img src=x onerror=alert(1)>', Extra: 'ignored' }])
      .mockReturnValueOnce([{ Name: '<b>Grace</b>' }, { Name: '' }])
      .mockReturnValueOnce([{ Name: 'Sam' }]);
    const file = new File(['xlsx'], 'form.xlsx');
    await expect(importExcel(file, 'IN')).resolves.toEqual({
      Personal: { name: '' },
      Contacts: { rows: [{ name: 'Grace' }] },
      Legal: { Beneficiaries: [{ name: 'Sam' }] },
    });
    expect(xlsx.read).toHaveBeenCalledWith(expect.any(Uint8Array), { type: 'array' });
  });

  it('preserves valid string values and maps only known fields', async () => {
    xlsx.read.mockReturnValue({ SheetNames: ['Personal'], Sheets: { Personal: {} } });
    xlsx.sheetToJson.mockReturnValue([{ Name: 'Ada', Unknown: 'ignored' }, { Name: '', Unknown: '' }]);
    await expect(importExcel(new File(['x'], 'data.xlsx'), 'US')).resolves.toEqual({ Personal: { name: 'Ada' } });
  });

  it('reports parse and config loading failures', async () => {
    xlsx.read.mockImplementation(() => { throw new Error('invalid'); });
    await expect(importExcel(new File(['x'], 'bad.xlsx'), 'US')).rejects.toThrow('Failed to parse Excel file. Please ensure it\'s a valid Excel file.');
    vi.mocked(getFormSections).mockRejectedValueOnce(new Error('offline'));
    await expect(importExcel(new File(['x'], 'bad.xlsx'), 'US')).rejects.toThrow('Failed to load form configuration');
  });

  it('exports populated and empty simple, table, and complex sections and skips absent sections', async () => {
    await exportToExcel({
      Personal: { name: 'Ada' },
      Contacts: { rows: [{ name: 'Grace' }] },
      Legal: { Beneficiaries: [] },
    }, 'CA');
    expect(xlsx.appendSheet).toHaveBeenCalledTimes(3);
    expect(xlsx.aoaToSheet).toHaveBeenCalledWith([['Name'], ['Ada']]);
    expect(xlsx.aoaToSheet).toHaveBeenCalledWith([['Name'], ['Grace']]);
    expect(xlsx.aoaToSheet).toHaveBeenCalledWith([['Name']]);
    expect(xlsx.writeFile).toHaveBeenCalledWith(expect.any(Object), expect.stringMatching(/^Onter_Care_CA_.*\.xlsx$/));
  });
});
