import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';

const saveDataMock = vi.fn();
const getDataMock = vi.fn();
const clearAllDataMock = vi.fn();

vi.mock('../utils/indexedDB', () => ({
  saveData: saveDataMock,
  getData: getDataMock,
  clearAllData: clearAllDataMock,
}));

let useAppStore: any;

beforeAll(async () => {
  ({ useAppStore } = await import('./appStore'));
});

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.getState().reset();
    vi.clearAllMocks();
    saveDataMock.mockResolvedValue(undefined);
    getDataMock.mockResolvedValue(null);
    clearAllDataMock.mockResolvedValue(undefined);
  });

  it('updates the selected country and form data', () => {
    act(() => {
      useAppStore.getState().setCountry('IN');
      useAppStore.getState().updateFormData('personalInfo', { name: 'Asha' });
    });

    const state = useAppStore.getState();
    expect(state.selectedCountry).toBe('IN');
    expect(state.formData.personalInfo).toEqual({ name: 'Asha' });
  });

  it('updates the step and import mode without writing empty stores', async () => {
    act(() => {
      useAppStore.getState().setStep(2);
      useAppStore.getState().setImportMode(true);
    });

    expect(useAppStore.getState().currentStep).toBe(2);
    expect(useAppStore.getState().isImportMode).toBe(true);

    await act(async () => {
      await useAppStore.getState().saveToIndexedDB();
    });

    expect(saveDataMock).not.toHaveBeenCalled();
  });

  it('saves data to IndexedDB with metadata', async () => {
    act(() => {
      useAppStore.getState().setCountry('CA');
      useAppStore.getState().updateFormData('personalInfo', { name: 'Asha' });
    });

    await act(async () => {
      await useAppStore.getState().saveToIndexedDB();
    });

    expect(saveDataMock).toHaveBeenCalledWith('formData', JSON.stringify({ personalInfo: { name: 'Asha' } }));
    expect(saveDataMock).toHaveBeenCalledWith('appMeta', JSON.stringify({ selectedCountry: 'CA', currentStep: 0 }));
  });

  it('loads saved data and marks the store as initialized', async () => {
    getDataMock.mockResolvedValueOnce(JSON.stringify({ personalInfo: { name: 'Asha' } }));

    let result = false;
    await act(async () => {
      result = await useAppStore.getState().loadFromIndexedDB();
    });

    expect(result).toBe(true);
    expect(useAppStore.getState().formData.personalInfo).toEqual({ name: 'Asha' });
    expect(useAppStore.getState().isDataLoaded).toBe(true);
  });

  it('handles missing data, missing metadata, and malformed persisted JSON', async () => {
    await expect(useAppStore.getState().loadFromIndexedDB()).resolves.toBe(false);

    getDataMock
      .mockResolvedValueOnce(JSON.stringify({ personalInfo: { name: 'Asha' } }))
      .mockResolvedValueOnce(null);
    await act(async () => useAppStore.getState().initializeFromStorage());
    expect(useAppStore.getState().selectedCountry).toBe('IN');
    expect(useAppStore.getState().currentStep).toBe(0);

    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    getDataMock.mockResolvedValueOnce('{invalid');
    await expect(useAppStore.getState().loadFromIndexedDB()).resolves.toBe(false);
    getDataMock.mockResolvedValueOnce('{invalid');
    await act(async () => useAppStore.getState().initializeFromStorage());
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it('initializes from storage when app starts', async () => {
    getDataMock
      .mockResolvedValueOnce(JSON.stringify({ personalInfo: { name: 'Asha' } }))
      .mockResolvedValueOnce(JSON.stringify({ selectedCountry: 'US', currentStep: 2 }));

    await act(async () => {
      await useAppStore.getState().initializeFromStorage();
    });

    const state = useAppStore.getState();
    expect(state.selectedCountry).toBe('US');
    expect(state.currentStep).toBe(2);
    expect(state.formData.personalInfo).toEqual({ name: 'Asha' });
  });

  it('clears all saved state', async () => {
    act(() => {
      useAppStore.getState().setCountry('US');
      useAppStore.getState().updateFormData('personalInfo', { name: 'Asha' });
    });

    await act(async () => {
      await useAppStore.getState().clearData();
    });

    const state = useAppStore.getState();
    expect(state.formData).toEqual({});
    expect(state.currentStep).toBe(0);
    expect(clearAllDataMock).toHaveBeenCalledTimes(1);
  });

  it('logs persistence failures without rejecting store actions', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    act(() => useAppStore.getState().updateFormData('personalInfo', { name: 'Asha' }));
    saveDataMock.mockRejectedValue(new Error('write failed'));
    await expect(useAppStore.getState().saveToIndexedDB()).resolves.toBeUndefined();
    clearAllDataMock.mockRejectedValue(new Error('clear failed'));
    await expect(useAppStore.getState().clearData()).resolves.toBeUndefined();
    expect(useAppStore.getState().formData.personalInfo).toEqual({ name: 'Asha' });
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});
