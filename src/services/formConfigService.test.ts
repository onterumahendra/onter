import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FormConfigService, createFormConfigService } from './formConfigService';
import { getFormSections, type FormSection } from '../constants';

vi.mock('../constants', () => ({ getFormSections: vi.fn() }));

const sections: FormSection[] = [{ section: 'Personal', type: 'simple', fields: [] }];

describe('FormConfigService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads the requested country sections', async () => {
    vi.mocked(getFormSections).mockResolvedValue([...sections]);
    const service = createFormConfigService();
    expect(service).toBeInstanceOf(FormConfigService);
    await expect(service.loadFormSections('US')).resolves.toEqual(sections);
    expect(getFormSections).toHaveBeenCalledWith('US');
  });

  it('logs and rethrows configuration errors', async () => {
    const error = new Error('config unavailable');
    vi.mocked(getFormSections).mockRejectedValue(error);
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(new FormConfigService().loadFormSections('ZZ')).rejects.toBe(error);
    expect(log).toHaveBeenCalledWith('Failed to load form sections for ZZ:', error);
    log.mockRestore();
  });
});
