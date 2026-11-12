/* eslint-disable @typescript-eslint/no-explicit-any */

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { act } from '@testing-library/react';

const saveDataMock = vi.fn();
const getDataMock = vi.fn();
const deleteDataMock = vi.fn();
const records = new Map<string, string>();

vi.mock('../utils/indexedDB', () => ({
  saveData: saveDataMock,
  getData: getDataMock,
  deleteData: deleteDataMock,
}));

let useAppStore: any;

beforeAll(async () => {
  ({ useAppStore } = await import('./appStore'));
});

describe('useAppStore', () => {
  beforeEach(() => {
    records.clear();
    useAppStore.getState().reset();
    vi.clearAllMocks();
    saveDataMock.mockImplementation(async (id: string, value: string) => {
      records.set(id, value);
    });
    getDataMock.mockImplementation(async (id: string) => records.get(id) ?? null);
    deleteDataMock.mockImplementation(async (...ids: string[]) => {
      ids.forEach(id => records.delete(id));
    });
  });

  it('clears the previous country form from memory when changing countries', () => {
    act(() => {
      useAppStore.getState().updateFormData('personalDetails', { name: 'Asha' });
      useAppStore.getState().setStep(2);
      useAppStore.getState().setCountry('US');
    });

    expect(useAppStore.getState().selectedCountry).toBe('US');
    expect(useAppStore.getState().formData).toEqual({});
    expect(useAppStore.getState().currentStep).toBe(0);
    expect(useAppStore.getState().isDataLoaded).toBe(false);
  });

  it('saves form data and progress under the selected country', async () => {
    act(() => {
      useAppStore.getState().setCountry('CA');
      useAppStore.getState().updateFormData('personalDetails', { name: 'Asha' });
      useAppStore.getState().setStep(2);
    });

    await act(async () => useAppStore.getState().saveToIndexedDB());

    expect(saveDataMock).toHaveBeenCalledWith(
      'countryData:CA',
      JSON.stringify({ formData: { personalDetails: { name: 'Asha' } }, currentStep: 2 }),
    );
    expect(saveDataMock).toHaveBeenCalledWith('appMeta', JSON.stringify({ selectedCountry: 'CA' }));
  });

  it('loads only the selected country data and does not leak another country into memory', async () => {
    records.set(
      'countryData:US',
      JSON.stringify({ formData: { personalDetails: { name: 'Jane' } }, currentStep: 1 }),
    );
    useAppStore.getState().setCountry('US');

    await expect(useAppStore.getState().loadFromIndexedDB('US')).resolves.toBe(true);
    expect(useAppStore.getState().formData.personalDetails.name).toBe('Jane');
    expect(useAppStore.getState().currentStep).toBe(1);

    useAppStore.getState().setCountry('IN');
    await expect(useAppStore.getState().loadFromIndexedDB('IN')).resolves.toBe(false);
    expect(useAppStore.getState().formData).toEqual({});
    expect(useAppStore.getState().currentStep).toBe(0);
  });

  it('migrates legacy data to the country recorded in its metadata', async () => {
    records.set('formData', JSON.stringify({ personalDetails: { name: 'Asha' } }));
    records.set('appMeta', JSON.stringify({ selectedCountry: 'IN', currentStep: 3 }));

    await act(async () => useAppStore.getState().initializeFromStorage());

    expect(useAppStore.getState().selectedCountry).toBe('IN');
    expect(useAppStore.getState().formData.personalDetails.name).toBe('Asha');
    expect(useAppStore.getState().currentStep).toBe(3);
    expect(records.has('countryData:IN')).toBe(true);
    expect(records.has('formData')).toBe(false);
  });

  it('assigns legacy data without country metadata to the default country only', async () => {
    records.set('formData', JSON.stringify({ personalDetails: { name: 'Asha' } }));

    useAppStore.getState().setCountry('US');
    await expect(useAppStore.getState().loadFromIndexedDB('US')).resolves.toBe(false);
    expect(records.has('formData')).toBe(true);
    expect(records.has('countryData:US')).toBe(false);

    useAppStore.getState().setCountry('IN');
    await expect(useAppStore.getState().loadFromIndexedDB('IN')).resolves.toBe(true);
    expect(useAppStore.getState().formData.personalDetails.name).toBe('Asha');
    expect(records.has('countryData:IN')).toBe(true);
  });

  it('does not reassign legacy data from an unsupported country to the default country', async () => {
    records.set('formData', JSON.stringify({ personalDetails: { name: 'Asha' } }));
    records.set('appMeta', JSON.stringify({ selectedCountry: 'ZZ' }));

    await act(async () => useAppStore.getState().initializeFromStorage());

    expect(useAppStore.getState().selectedCountry).toBe('IN');
    expect(useAppStore.getState().formData).toEqual({});
    expect(records.has('formData')).toBe(true);
    expect(records.has('countryData:IN')).toBe(false);
  });

  it('does not apply a late load after the user changes countries', async () => {
    let resolveStoredData: ((value: string | null) => void) | undefined;
    getDataMock.mockImplementationOnce(() => new Promise(resolve => {
      resolveStoredData = resolve;
    }));

    const loadPromise = useAppStore.getState().loadFromIndexedDB('IN');
    useAppStore.getState().setCountry('US');
    resolveStoredData?.(JSON.stringify({ formData: { personalDetails: { name: 'Asha' } }, currentStep: 0 }));

    await expect(loadPromise).resolves.toBe(true);
    expect(useAppStore.getState().selectedCountry).toBe('US');
    expect(useAppStore.getState().formData).toEqual({});
  });

  it('clears only the selected country data and any matching legacy copy', async () => {
    records.set('countryData:IN', JSON.stringify({ formData: { Personal: { name: 'Asha' } }, currentStep: 0 }));
    records.set('countryData:US', JSON.stringify({ formData: { Personal: { name: 'Jane' } }, currentStep: 0 }));
    records.set('formData', JSON.stringify({ Personal: { name: 'Asha' } }));
    records.set('appMeta', JSON.stringify({ selectedCountry: 'IN' }));

    await act(async () => useAppStore.getState().clearData());

    expect(deleteDataMock).toHaveBeenCalledWith('countryData:IN', 'formData');
    expect(records.has('countryData:IN')).toBe(false);
    expect(records.has('formData')).toBe(false);
    expect(records.has('countryData:US')).toBe(true);
    expect(useAppStore.getState().formData).toEqual({});
  });

  it('does not offer malformed or empty records as resumable sessions', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    records.set('countryData:IN', '{invalid');
    await expect(useAppStore.getState().loadFromIndexedDB('IN')).resolves.toBe(false);
    expect(useAppStore.getState().formData).toEqual({});

    records.set('countryData:IN', JSON.stringify({ formData: {}, currentStep: 5 }));
    await expect(useAppStore.getState().loadFromIndexedDB('IN')).resolves.toBe(false);
    expect(useAppStore.getState().currentStep).toBe(0);
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it('restores the last country and its session on initialization', async () => {
    records.set('appMeta', JSON.stringify({ selectedCountry: 'US' }));
    records.set('countryData:US', JSON.stringify({
      formData: { personalDetails: { name: 'Jane' } },
      currentStep: 2,
    }));

    await act(async () => useAppStore.getState().initializeFromStorage());

    expect(useAppStore.getState().selectedCountry).toBe('US');
    expect(useAppStore.getState().currentStep).toBe(2);
    expect(useAppStore.getState().formData.personalDetails.name).toBe('Jane');
  });

  it('reports persistence failures and leaves the in-memory data intact', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    useAppStore.getState().updateFormData('personalDetails', { name: 'Asha' });
    saveDataMock.mockRejectedValue(new Error('write failed'));
    await expect(useAppStore.getState().saveToIndexedDB()).resolves.toBeUndefined();
    deleteDataMock.mockRejectedValue(new Error('delete failed'));
    await expect(useAppStore.getState().clearData()).rejects.toThrow('delete failed');
    expect(useAppStore.getState().formData.personalDetails.name).toBe('Asha');
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});
