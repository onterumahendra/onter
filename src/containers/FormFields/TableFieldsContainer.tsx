import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { useFieldValidation } from '../../hooks/useFieldValidation';
import { TableFieldsGrid } from '../../components/FormFields/TableFieldsGrid';
import type { BaseField } from '../../constants/types';

interface TableFieldsContainerProps {
  columns: BaseField[];
  sectionName: string;
  minRows?: number;
  maxRows?: number;
}

/**
 * Container component for table fields
 * Follows Single Responsibility: Manages table state and validation
 * Follows Dependency Inversion: Uses hooks for dependencies
 */
export function TableFieldsContainer({ 
  columns, 
  sectionName, 
  minRows = 0, 
  maxRows = 100 
}: TableFieldsContainerProps) {
  const { formData, updateFormData } = useAppStore();
  const { validateField } = useFieldValidation();
  const [rowErrors, setRowErrors] = useState<Record<string, Record<string, string>>>({});

  const sectionData = formData[sectionName] || {};
  const rows = sectionData.rows || [];

  // Check if the last row is complete (all required fields filled)
  const isLastRowComplete = () => {
    if (rows.length === 0) return true;
    const lastRow = rows[rows.length - 1];
    return columns.every(col => {
      if (col.validation?.required) {
        const value = lastRow[col.name];
        return value !== undefined && value !== null && value !== '';
      }
      return true;
    });
  };

  // Initialize with minimum rows
  useEffect(() => {
    if (rows.length === 0 && minRows > 0) {
      const initialRows = Array(minRows).fill(null).map(() => {
        const row: any = {};
        columns.forEach(col => {
          row[col.name] = '';
        });
        return row;
      });
      updateFormData(sectionName, { rows: initialRows });
    }
  }, [rows.length, minRows, columns, sectionName, updateFormData]);

  const handleAddRow = () => {
    if (rows.length >= maxRows) return;
    
    const newRow: any = {};
    columns.forEach(col => {
      newRow[col.name] = '';
    });
    updateFormData(sectionName, { rows: [...rows, newRow] });
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length <= minRows) return;
    
    const newRows = rows.filter((_: any, i: number) => i !== index);
    updateFormData(sectionName, { rows: newRows });
    
    // Clear errors for removed row
    const newErrors = { ...rowErrors };
    delete newErrors[index];
    setRowErrors(newErrors);
  };

  const handleCellChange = (rowIndex: number, fieldName: string, value: any) => {
    const newRows = [...rows];
    newRows[rowIndex] = { ...newRows[rowIndex], [fieldName]: value };
    updateFormData(sectionName, { rows: newRows });

    // Clear error for this cell
    const newErrors = { ...rowErrors };
    if (newErrors[rowIndex]) {
      delete newErrors[rowIndex][fieldName];
      setRowErrors(newErrors);
    }
  };

  const handleCellBlur = (rowIndex: number, fieldName: string) => {
    const field = columns.find(col => col.name === fieldName);
    if (field) {
      const value = rows[rowIndex]?.[fieldName];
      const error = validateField(field, value);
      if (error) {
        setRowErrors(prev => ({
          ...prev,
          [rowIndex]: { ...prev[rowIndex], [fieldName]: error }
        }));
      }
    }
  };

  return (
    <TableFieldsGrid
      columns={columns}
      rows={rows}
      errors={rowErrors}
      minRows={minRows}
      maxRows={maxRows}
      onAddRow={handleAddRow}
      onRemoveRow={handleRemoveRow}
      onCellChange={handleCellChange}
      onCellBlur={handleCellBlur}
      isLastRowComplete={isLastRowComplete()}
    />
  );
}
