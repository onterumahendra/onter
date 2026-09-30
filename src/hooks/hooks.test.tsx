import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebounce } from './useDebounce';
import { useFieldValidation } from './useFieldValidation';
import { useFormConfig } from './useFormConfig';
import type { FormSection } from '../constants/types';

vi.mock('../store/appStore', () => ({
  useAppStore: () => ({ selectedCountry: 'US' }),
}));

const section: FormSection = { section: 'Personal', type: 'simple', fields: [] };

describe('useDebounce', () => {
  beforeEach(() => vi.useFakeTimers());
  it('updates after the delay and cancels a stale timer on change', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 100), { initialProps: { value: 'first' } });
    expect(result.current).toBe('first');
    rerender({ value: 'second' });
    act(() => vi.advanceTimersByTime(99));
    expect(result.current).toBe('first');
    rerender({ value: 'third' });
    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe('third');
    vi.useRealTimers();
  });
});

describe('useFieldValidation', () => {
  it('delegates validation and manages individual and all errors', () => {
    const service = { validateField: vi.fn(() => 'invalid'), validateAllFields: vi.fn() };
    const { result } = renderHook(() => useFieldValidation(service));
    const field = { name: 'email', label: 'Email', type: 'email' as const };
    expect(result.current.validateField(field, 'bad')).toBe('invalid');
    act(() => result.current.setFieldError('email', 'Invalid email'));
    act(() => result.current.setFieldError('name', 'Required'));
    expect(result.current.errors).toEqual({ email: 'Invalid email', name: 'Required' });
    act(() => result.current.clearFieldError('email'));
    expect(result.current.errors).toEqual({ name: 'Required' });
    act(() => result.current.clearAllErrors());
    expect(result.current.errors).toEqual({});
    expect(service.validateField).toHaveBeenCalledWith(field, 'bad');
  });
});

describe('useFormConfig', () => {
  it('loads sections, reloads on request, and reports service failures', async () => {
    const service = { loadFormSections: vi.fn().mockResolvedValue([section]) };
    const { result } = renderHook(() => useFormConfig(service));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.formSections).toEqual([section]);
    expect(service.loadFormSections).toHaveBeenCalledWith('US');

    await act(async () => result.current.reload());
    expect(service.loadFormSections).toHaveBeenCalledTimes(2);

    service.loadFormSections.mockRejectedValueOnce('failure');
    await act(async () => result.current.reload());
    expect(result.current.error).toEqual(new Error('Failed to load form configuration'));
    expect(result.current.isLoading).toBe(false);
  });
});
