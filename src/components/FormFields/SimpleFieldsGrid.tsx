import { TextInput, Textarea, Select, NumberInput, Grid } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import type { BaseField } from '../../constants/types';

interface SimpleFieldProps {
  field: BaseField;
  value: any;
  error?: string;
  onChange: (value: any) => void;
  onBlur?: () => void;
  hideLabel?: boolean;
}

/**
 * Pure presentational component for rendering a single form field
 * Follows Single Responsibility: Only renders UI, no business logic
 */
export function SimpleField({ field, value, error, onChange, onBlur, hideLabel = false }: SimpleFieldProps) {
  const commonProps = {
    label: hideLabel ? undefined : field.label,
    placeholder: field.placeholder,
    value: value || '',
    onBlur: onBlur,
    error: error,
    withAsterisk: hideLabel ? false : field.validation?.required,
    styles: (theme: any) => ({
      error: { color: theme.other.errorText },
      input: error ? {
        borderColor: theme.other.errorBorder,
        backgroundColor: theme.other.errorBg
      } : {}
    })
  };

  switch (field.type) {
    case 'textarea':
      return (
        <Textarea
          {...commonProps}
          onChange={(event) => onChange(event.currentTarget.value)}
          minRows={4}
          autosize
        />
      );

    case 'select':
      return (
        <Select
          {...commonProps}
          data={field.options || []}
          onChange={(value) => onChange(value)}
          clearable
          searchable
        />
      );

    case 'number':
      return (
        <NumberInput
          {...commonProps}
          onChange={(value) => onChange(value)}
          min={field.validation?.min}
          max={field.validation?.max}
        />
      );

    case 'date':
      return (
        <DateInput
          {...commonProps}
          onChange={(value) => onChange(value)}
          valueFormat="DD/MM/YYYY"
          clearable
        />
      );

    case 'email':
      return (
        <TextInput
          {...commonProps}
          onChange={(event) => onChange(event.currentTarget.value)}
          type="email"
        />
      );

    default:
      return (
        <TextInput
          {...commonProps}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
      );
  }
}

interface SimpleFieldsGridProps {
  fields: BaseField[];
  values: Record<string, any>;
  errors: Record<string, string>;
  onChange: (name: string, value: any) => void;
  onBlur?: (name: string) => void;
}

/**
 * Presentational component for rendering a grid of form fields
 * Follows Single Responsibility: Only renders UI layout
 */
export function SimpleFieldsGrid({ fields, values, errors, onChange, onBlur }: SimpleFieldsGridProps) {
  return (
    <Grid>
      {fields.map((field) => (
        <Grid.Col key={field.name} span={{ base: 12, sm: field.type === 'textarea' ? 12 : 6 }}>
          <SimpleField
            field={field}
            value={values[field.name]}
            error={errors[field.name]}
            onChange={(value) => onChange(field.name, value)}
            onBlur={() => onBlur?.(field.name)}
          />
        </Grid.Col>
      ))}
    </Grid>
  );
}
