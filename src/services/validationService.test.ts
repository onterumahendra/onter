import { describe, expect, it } from 'vitest';
import { createValidationService, ValidationService } from './validationService';
import type { BaseField } from '../constants/types';

const service = new ValidationService();
const field = (validation: BaseField['validation']): BaseField => ({
  name: 'name',
  label: 'Name',
  type: 'text',
  validation,
});

describe('ValidationService', () => {
  it('returns null when validation is not configured or values are valid', () => {
    expect(service.validateField(field(undefined), '')).toBeNull();
    expect(service.validateField(field({ required: true }), 'Ada')).toBeNull();
    expect(service.validateField(field({ minLength: 2, maxLength: 4 }), 'Ada')).toBeNull();
    expect(service.validateField(field({ min: 2, max: 5 }), 3)).toBeNull();
    expect(service.validateField(field({ pattern: '^\\d+$' }), '123')).toBeNull();
  });

  it('validates required values and prefers configured messages', () => {
    expect(service.validateField(field({ required: true }), '')).toBe('Name is required');
    expect(service.validateField(field({ required: true, errorMessage: 'Required!' }), undefined)).toBe('Required!');
    expect(service.validateField(field({ required: true }), 0)).toBe('Name is required');
  });

  it('validates string lengths, numeric ranges, and patterns', () => {
    expect(service.validateField(field({ minLength: 3 }), 'ab')).toContain('at least 3 characters');
    expect(service.validateField(field({ maxLength: 2 }), 'abc')).toContain('not exceed 2 characters');
    expect(service.validateField(field({ min: 3 }), 2)).toContain('at least 3');
    expect(service.validateField(field({ max: 3 }), 4)).toContain('not exceed 3');
    expect(service.validateField(field({ pattern: '^\\d+$' }), 'abc')).toContain('format is invalid');
  });

  it('validates multiple fields and creates the service through its factory', () => {
    expect(createValidationService()).toBeInstanceOf(ValidationService);
    expect(service.validateAllFields([
      field({ required: true }),
      { ...field(undefined), name: 'email' },
    ], { email: 'a@example.com' })).toEqual({ name: 'Name is required' });
  });
});
