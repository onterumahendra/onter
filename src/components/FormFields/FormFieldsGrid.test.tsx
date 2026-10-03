import { fireEvent, render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { theme } from '../../theme';
import { SimpleField, SimpleFieldsGrid } from './SimpleFieldsGrid';
import { TableFieldsGrid } from './TableFieldsGrid';
import { ComplexFieldsGrid } from './ComplexFieldsGrid';
import type { BaseField } from '../../constants/types';

const media = vi.hoisted(() => ({ mobile: false }));
vi.mock('@mantine/hooks', async () => {
  const actual = await vi.importActual<typeof import('@mantine/hooks')>('@mantine/hooks');
  return { ...actual, useMediaQuery: () => media.mobile };
});
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const field = (name: string, type: BaseField['type'] = 'text'): BaseField => ({ name, label: name, type });
const wrap = (element: React.ReactNode) => render(<MantineProvider theme={theme}>{element}</MantineProvider>);

beforeEach(() => { media.mobile = false; });

describe('SimpleField and SimpleFieldsGrid', () => {
  it('renders each supported field type and reports changes and blur', () => {
    const onChange = vi.fn();
    const onBlur = vi.fn();
    const fields = [
      field('text'), field('email', 'email'), field('note', 'textarea'),
      field('age', 'number'), { ...field('country', 'select'), options: ['Canada'] },
      field('region', 'select'), field('date', 'date'),
    ];
    const { rerender } = wrap(<SimpleFieldsGrid fields={fields} values={{}} errors={{}} onChange={onChange} onBlur={onBlur} />);
    for (const item of fields.filter(item => item.type !== 'select')) {
      expect(screen.getByLabelText(item.label)).toBeInTheDocument();
    }
    expect(screen.getByRole('combobox', { name: 'country' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'region' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('text'), { target: { value: 'Ada' } });
    fireEvent.blur(screen.getByLabelText('text'));
    expect(onChange).toHaveBeenCalledWith('text', 'Ada');
    expect(onBlur).toHaveBeenCalledWith('text');

    fireEvent.change(screen.getByLabelText('email'), { target: { value: 'ada@example.com' } });
    fireEvent.change(screen.getByLabelText('note'), { target: { value: 'A note' } });
    fireEvent.change(screen.getByLabelText('age'), { target: { value: '42' } });
    fireEvent.click(screen.getByRole('combobox', { name: 'country' }));
    fireEvent.click(screen.getByRole('option', { name: 'Canada' }));
    fireEvent.change(screen.getByLabelText('date'), { target: { value: '03/10/2026' } });
    for (const name of ['email', 'note', 'age', 'country', 'date']) {
      expect(onChange.mock.calls.some(([changedName]) => changedName === name)).toBe(true);
    }

    rerender(<MantineProvider theme={theme}><SimpleField field={field('hidden')} value="" error="bad" onChange={onChange} hideLabel /></MantineProvider>);
    expect(screen.queryByLabelText('hidden')).not.toBeInTheDocument();
  }, 15000);

  it('allows grid fields to blur when no blur callback is supplied', () => {
    wrap(<SimpleFieldsGrid fields={[field('text')]} values={{}} errors={{}} onChange={vi.fn()} />);
    fireEvent.blur(screen.getByLabelText('text'));
  });

  it('uses default text rendering for an unknown field type', () => {
    wrap(<SimpleField field={{ ...field('other'), type: 'unknown' as BaseField['type'] }} value={undefined} onChange={vi.fn()} />);
    expect(screen.getByLabelText('other')).toBeInTheDocument();
  });
});

describe('TableFieldsGrid', () => {
  const columns = [field('name')];
  const callbacks = () => ({ onAddRow: vi.fn(), onRemoveRow: vi.fn(), onCellChange: vi.fn(), onCellBlur: vi.fn() });

  it('renders desktop empty and populated states and enforces row limits', () => {
    const handlers = callbacks();
    const props = { columns, errors: {}, minRows: 1, maxRows: 1, ...handlers };
    const { rerender } = wrap(<TableFieldsGrid {...props} rows={[]} />);
    expect(screen.getByText('table.noEntries')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /table.addRowWithCount/ }));
    expect(handlers.onAddRow).toHaveBeenCalled();

    rerender(<MantineProvider theme={theme}><TableFieldsGrid {...props} rows={[{ name: 'Ada' }]} /></MantineProvider>);
    expect(screen.getByDisplayValue('Ada')).toBeInTheDocument();
    expect(screen.getByText('table.maxRowsReached')).toBeInTheDocument();
    const nameInput = screen.getByDisplayValue('Ada');
    fireEvent.change(nameInput, { target: { value: 'Grace' } });
    fireEvent.blur(nameInput);
    expect(handlers.onCellChange).toHaveBeenCalledWith(0, 'name', 'Grace');
    expect(handlers.onCellBlur).toHaveBeenCalledWith(0, 'name');
    expect(handlers.onRemoveRow).not.toHaveBeenCalled();
  });

  it('renders mobile cards and permits removal above the minimum row count', () => {
    media.mobile = true;
    const handlers = callbacks();
    wrap(<TableFieldsGrid columns={columns} rows={[{ name: 'Ada' }]} errors={{}} minRows={0} {...handlers} />);
    expect(screen.getByText('table.entry #1')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('table.removeRow'));
    expect(handlers.onRemoveRow).toHaveBeenCalledWith(0);
  });
});

describe('ComplexFieldsGrid', () => {
  it('renders subsection headings and routes subsection actions', () => {
    const onAddRow = vi.fn();
    const onRemoveRow = vi.fn();
    const onCellChange = vi.fn();
    const onCellBlur = vi.fn();
    const structure = [
      { title: 'Contacts', type: 'table' as const, columns: [field('phone')], minRows: 0, maxRows: 3 },
      { title: 'Accounts', type: 'table' as const, columns: [field('bank')] },
    ];
    wrap(<ComplexFieldsGrid structure={structure} values={{ Contacts: [{ phone: '1' }] }} errors={{}} onChange={vi.fn()} onAddRow={onAddRow} onRemoveRow={onRemoveRow} onCellChange={onCellChange} onCellBlur={onCellBlur} isLastRowComplete={() => true} />);
    expect(screen.getByText('Contacts')).toBeInTheDocument();
    expect(screen.getByText('Accounts')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: /table.addRowWithCount/ })[0]);
    fireEvent.change(screen.getByDisplayValue('1'), { target: { value: '2' } });
    expect(onAddRow).toHaveBeenCalledWith('Contacts');
    expect(onCellChange).toHaveBeenCalledWith('Contacts', 0, 'phone', '2');
  });
});
