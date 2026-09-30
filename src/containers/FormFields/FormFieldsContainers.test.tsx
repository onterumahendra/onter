import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { afterEach, describe, expect, it } from 'vitest';
import { theme } from '../../theme';
import { useAppStore } from '../../store/appStore';
import { SimpleFieldsContainer } from './SimpleFieldsContainer';
import { TableFieldsContainer } from './TableFieldsContainer';
import { ComplexFieldsContainer } from './ComplexFieldsContainer';
import type { BaseField, ComplexSubSection } from '../../constants/types';

const wrap = (element: React.ReactNode) => render(<MantineProvider theme={theme}>{element}</MantineProvider>);
const requiredName: BaseField = { name: 'name', label: 'Name', type: 'text', validation: { required: true } };

afterEach(() => useAppStore.getState().reset());

describe('form field containers', () => {
  it('validates simple fields on blur and clears errors on change', () => {
    wrap(<SimpleFieldsContainer fields={[requiredName]} sectionName="Personal" />);
    const input = screen.getByRole('textbox');
    fireEvent.blur(input);
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    fireEvent.change(input, { target: { value: 'Ada' } });
    expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
    expect(useAppStore.getState().formData.Personal).toEqual({ name: 'Ada' });
  });

  it('initializes required table rows and handles adding, validation, editing, and removal', async () => {
    wrap(<TableFieldsContainer columns={[requiredName]} sectionName="Contacts" minRows={1} maxRows={2} />);
    await waitFor(() => expect(useAppStore.getState().formData.Contacts?.rows).toEqual([{ name: '' }]));
    expect(screen.getByDisplayValue('')).toBeInTheDocument();

    act(() => useAppStore.getState().updateFormData('Contacts', { rows: [{ name: '' }] }));
    const input = screen.getByRole('textbox');
    fireEvent.blur(input);
    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    fireEvent.change(input, { target: { value: 'Ada' } });
    expect(useAppStore.getState().formData.Contacts.rows[0]).toEqual({ name: 'Ada' });

    fireEvent.click(screen.getByRole('button', { name: /table.addRowWithCount/ }));
    expect(useAppStore.getState().formData.Contacts.rows).toHaveLength(2);
    fireEvent.click(screen.getAllByTitle('table.removeRow')[0]);
    expect(useAppStore.getState().formData.Contacts.rows).toHaveLength(1);
  });

  it('updates complex subsection rows and validates cells', async () => {
    const structure: ComplexSubSection[] = [{ title: 'Beneficiaries', type: 'table', columns: [requiredName], minRows: 1, maxRows: 3 }];
    act(() => useAppStore.getState().updateFormData('Estate', { Beneficiaries: [{ name: '' }] }));
    wrap(<ComplexFieldsContainer structure={structure} sectionName="Estate" />);
    const input = screen.getByRole('textbox');
    fireEvent.blur(input);
    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    fireEvent.change(input, { target: { value: 'Grace' } });
    expect(useAppStore.getState().formData.Estate.Beneficiaries[0]).toEqual({ name: 'Grace' });
    fireEvent.click(screen.getByRole('button', { name: /table.addRowWithCount/ }));
    expect(useAppStore.getState().formData.Estate.Beneficiaries).toHaveLength(2);
  });
});
