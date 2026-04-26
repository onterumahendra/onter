import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { useFieldValidation } from '../../hooks/useFieldValidation';
import { ComplexFieldsGrid } from '../../components/FormFields/ComplexFieldsGrid';
import type { ComplexSubSection } from '../../constants/types';

interface ComplexFieldsContainerProps {
  structure: ComplexSubSection[];
  sectionName: string;
}

/**
 * Container component for complex nested fields
 * Follows Single Responsibility: Manages complex field state
 * Follows Dependency Inversion: Uses hooks for dependencies
 */
export function ComplexFieldsContainer({ structure, sectionName }: ComplexFieldsContainerProps) {
  const { formData, updateFormData } = useAppStore();
  const { validateField } = useFieldValidation();
  const [errors, setErrors] = useState<Record<string, Record<string, Record<string, string>>>>({});

  const sectionData = formData[sectionName] || {};

  // Check if the last row is complete for a specific subsection
  const isLastRowComplete = (subSectionTitle: string) => {
    const subSection = structure.find(s => s.title === subSectionTitle);
    if (!subSection) return true;

    const currentRows = sectionData[subSectionTitle] || [];
    if (currentRows.length === 0) return true;

    const lastRow = currentRows[currentRows.length - 1];
    return subSection.columns.every(col => {
      if (col.validation?.required) {
        const value = lastRow[col.name];
        return value !== undefined && value !== null && value !== '';
      }
      return true;
    });
  };

  const handleChange = (subSectionTitle: string, rows: any[]) => {
    updateFormData(sectionName, {
      ...sectionData,
      [subSectionTitle]: rows
    });
  };

  const handleAddRow = (subSectionTitle: string) => {
    const subSection = structure.find(s => s.title === subSectionTitle);
    if (!subSection) return;

    const currentRows = sectionData[subSectionTitle] || [];
    if (subSection.maxRows && currentRows.length >= subSection.maxRows) return;

    const newRow: any = {};
    subSection.columns.forEach(col => {
      newRow[col.name] = '';
    });

    handleChange(subSectionTitle, [...currentRows, newRow]);
  };

  const handleRemoveRow = (subSectionTitle: string, rowIndex: number) => {
    const subSection = structure.find(s => s.title === subSectionTitle);
    if (!subSection) return;

    const currentRows = sectionData[subSectionTitle] || [];
    if (subSection.minRows && currentRows.length <= subSection.minRows) return;

    const newRows = currentRows.filter((_: any, i: number) => i !== rowIndex);
    handleChange(subSectionTitle, newRows);

    // Clear errors for removed row
    const newErrors = { ...errors };
    if (newErrors[subSectionTitle]) {
      delete newErrors[subSectionTitle][rowIndex];
      setErrors(newErrors);
    }
  };

  const handleCellChange = (subSectionTitle: string, rowIndex: number, fieldName: string, value: any) => {
    const currentRows = sectionData[subSectionTitle] || [];
    const newRows = [...currentRows];
    newRows[rowIndex] = { ...newRows[rowIndex], [fieldName]: value };
    handleChange(subSectionTitle, newRows);

    // Clear error for this cell
    const newErrors = { ...errors };
    if (newErrors[subSectionTitle]?.[rowIndex]) {
      delete newErrors[subSectionTitle][rowIndex][fieldName];
      setErrors(newErrors);
    }
  };

  const handleCellBlur = (subSectionTitle: string, rowIndex: number, fieldName: string) => {
    const subSection = structure.find(s => s.title === subSectionTitle);
    if (!subSection) return;

    const field = subSection.columns.find(col => col.name === fieldName);
    if (!field) return;

    const currentRows = sectionData[subSectionTitle] || [];
    const value = currentRows[rowIndex]?.[fieldName];
    const error = validateField(field, value);

    if (error) {
      setErrors(prev => ({
        ...prev,
        [subSectionTitle]: {
          ...(prev[subSectionTitle] || {}),
          [rowIndex]: {
            ...(prev[subSectionTitle]?.[rowIndex] || {}),
            [fieldName]: error
          }
        }
      }));
    }
  };

  return (
    <ComplexFieldsGrid
      structure={structure}
      values={sectionData}
      errors={errors}
      onChange={handleChange}
      onAddRow={handleAddRow}
      onRemoveRow={handleRemoveRow}
      onCellChange={handleCellChange}
      onCellBlur={handleCellBlur}
      isLastRowComplete={isLastRowComplete}
    />
  );
}
