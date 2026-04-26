import { Stack, Title, Divider } from '@mantine/core';
import { TableFieldsGrid } from './TableFieldsGrid';
import type { ComplexSubSection } from '../../constants/types';

interface ComplexFieldsGridProps {
  structure: ComplexSubSection[];
  values: Record<string, any[]>;
  errors: Record<string, Record<string, Record<string, string>>>;
  onChange: (subSectionTitle: string, rows: any[]) => void;
  onAddRow: (subSectionTitle: string) => void;
  onRemoveRow: (subSectionTitle: string, rowIndex: number) => void;
  onCellChange: (subSectionTitle: string, rowIndex: number, fieldName: string, value: any) => void;
  onCellBlur?: (subSectionTitle: string, rowIndex: number, fieldName: string) => void;
  isLastRowComplete?: (subSectionTitle: string) => boolean;
}

/**
 * Pure presentational component for complex nested fields
 * Follows Single Responsibility: Only renders nested structure UI
 */
export function ComplexFieldsGrid({
  structure,
  values,
  errors,
  onAddRow,
  onRemoveRow,
  onCellChange,
  onCellBlur,
  isLastRowComplete
}: ComplexFieldsGridProps) {
  return (
    <Stack gap="xl">
      {structure.map((subSection, index) => (
        <div key={index}>
          <Title order={4} mb="md" c="slate.6">
            {subSection.title}
          </Title>
          <TableFieldsGrid
            columns={subSection.columns}
            rows={values[subSection.title] || []}
            errors={errors[subSection.title] || {}}
            minRows={subSection.minRows}
            maxRows={subSection.maxRows}
            onAddRow={() => onAddRow(subSection.title)}
            onRemoveRow={(rowIndex) => onRemoveRow(subSection.title, rowIndex)}
            onCellChange={(rowIndex, fieldName, value) => 
              onCellChange(subSection.title, rowIndex, fieldName, value)
            }
            onCellBlur={onCellBlur ? (rowIndex, fieldName) => 
              onCellBlur(subSection.title, rowIndex, fieldName) : undefined
            }
            isLastRowComplete={isLastRowComplete ? isLastRowComplete(subSection.title) : true}
          />
          {index < structure.length - 1 && <Divider my="xl" />}
        </div>
      ))}
    </Stack>
  );
}
