import { Table, Button, Group, ActionIcon, Box, Text, ScrollArea } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { SimpleField } from './SimpleFieldsGrid';
import type { BaseField } from '../../constants/types';

interface TableFieldsGridProps {
  columns: BaseField[];
  rows: any[];
  errors: Record<string, Record<string, string>>;
  minRows?: number;
  maxRows?: number;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  onCellChange: (rowIndex: number, fieldName: string, value: any) => void;
  onCellBlur?: (rowIndex: number, fieldName: string) => void;
  isLastRowComplete?: boolean;
}

/**
 * Pure presentational component for table fields
 * Follows Single Responsibility: Only renders table UI
 */
export function TableFieldsGrid({
  columns,
  rows,
  errors,
  minRows = 0,
  maxRows = 100,
  onAddRow,
  onRemoveRow,
  onCellChange,
  onCellBlur,
  isLastRowComplete = true
}: TableFieldsGridProps) {
  const { t } = useTranslation();

  return (
    <Box>
      <ScrollArea>
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              {columns.map((col) => (
                <Table.Th key={col.name} style={{ minWidth: 180 }}>
                  <Text size="sm" fw={600}>
                    {col.label}
                    {col.validation?.required && <Text component="span" c="red.6"> *</Text>}
                  </Text>
                </Table.Th>
              ))}
              <Table.Th style={{ width: 80 }}>{t('table.actions')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={columns.length + 1}>
                  <Text c="dimmed" ta="center" py="xl">
                    {t('table.noEntries')}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              rows.map((row, rowIndex) => (
                <Table.Tr key={rowIndex}>
                  {columns.map((col) => (
                    <Table.Td key={col.name} style={{ verticalAlign: 'top', padding: '8px' }}>
                      <SimpleField
                        field={col}
                        value={row[col.name]}
                        error={errors[rowIndex]?.[col.name]}
                        onChange={(value) => onCellChange(rowIndex, col.name, value)}
                        onBlur={() => onCellBlur?.(rowIndex, col.name)}
                        hideLabel={true}
                      />
                    </Table.Td>
                  ))}
                  <Table.Td style={{ verticalAlign: 'top', padding: '8px' }}>
                    <ActionIcon
                      color="red"
                      variant="light"
                      onClick={() => onRemoveRow(rowIndex)}
                      disabled={rows.length <= minRows}
                      title={rows.length <= minRows ? t('table.minRowsRequired', { min: minRows }) : t('table.removeRow')}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea>

      <Group mt="md">
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={onAddRow}
          disabled={rows.length >= maxRows || (rows.length > 0 && !isLastRowComplete)}
          variant="light"
          size="sm"
        >
          {maxRows ? t('table.addRowWithCount', { current: rows.length, max: maxRows }) : t('table.addRow')}
        </Button>
        {rows.length > 0 && !isLastRowComplete && (
          <Text size="sm" c="orange.6">{t('table.completeCurrentRow')}</Text>
        )}
        {maxRows && rows.length >= maxRows && (
          <Text size="sm" c="dimmed">{t('table.maxRowsReached')}</Text>
        )}
      </Group>
    </Box>
  );
}
