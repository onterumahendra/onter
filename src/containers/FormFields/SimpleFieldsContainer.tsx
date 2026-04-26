import { useAppStore } from '../../store/appStore';
import { useFieldValidation } from '../../hooks/useFieldValidation';
import { SimpleFieldsGrid } from '../../components/FormFields/SimpleFieldsGrid';
import type { BaseField } from '../../constants/types';

interface SimpleFieldsContainerProps {
  fields: BaseField[];
  sectionName: string;
}

/**
 * Container component for simple fields
 * Follows Single Responsibility: Connects UI with state management
 * Follows Dependency Inversion: Uses hooks for dependencies
 */
export function SimpleFieldsContainer({ fields, sectionName }: SimpleFieldsContainerProps) {
  const { formData, updateFormData } = useAppStore();
  const { errors, validateField, setFieldError, clearFieldError } = useFieldValidation();

  const sectionData = formData[sectionName] || {};

  const handleChange = (name: string, value: any) => {
    updateFormData(sectionName, {
      ...sectionData,
      [name]: value
    });
    clearFieldError(name);
  };

  const handleBlur = (name: string) => {
    const field = fields.find(f => f.name === name);
    if (field) {
      const error = validateField(field, sectionData[name]);
      if (error) {
        setFieldError(name, error);
      }
    }
  };

  return (
    <SimpleFieldsGrid
      fields={fields}
      values={sectionData}
      errors={errors}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
}
