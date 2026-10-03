import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { FormStepper } from './FormStepper';
import { theme } from '../theme';
import { useAppStore } from '../store/appStore';
import type { FormSection } from '../constants/types';

const mocks = vi.hoisted(() => ({ sections: [] as FormSection[], loading: false, mobile: false, navigate: vi.fn(), download: vi.fn() }));
vi.mock('../hooks/useFormConfig', () => ({ useFormConfig: () => ({ formSections: mocks.sections, isLoading: mocks.loading }) }));
vi.mock('@mantine/hooks', async () => {
  const actual = await vi.importActual<typeof import('@mantine/hooks')>('@mantine/hooks');
  return { ...actual, useMediaQuery: () => mocks.mobile };
});
vi.mock('../utils/zipService', () => ({ downloadFormAsZip: mocks.download }));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mocks.navigate };
});
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const nameField = { name: 'name', label: 'Name', type: 'text' as const, validation: { required: true } };
const sections: FormSection[] = [
  { section: 'Personal', type: 'simple', fields: [nameField] },
  { section: 'Contacts', type: 'table', columns: [nameField], minRows: 1, maxRows: 3 },
  { section: 'Estate', type: 'complex', structure: [{ title: 'Beneficiaries', type: 'table', columns: [nameField], minRows: 1 }] },
];
const renderStepper = () => render(<MantineProvider theme={theme}><MemoryRouter><FormStepper /></MemoryRouter></MantineProvider>);

beforeEach(() => {
  vi.useRealTimers();
  mocks.sections = sections;
  mocks.loading = false;
  mocks.mobile = false;
  mocks.navigate.mockReset();
  mocks.download.mockReset().mockResolvedValue(undefined);
  useAppStore.getState().reset();
});

describe('FormStepper', () => {
  it('shows configuration loading state', () => {
    mocks.loading = true;
    renderStepper();
    expect(screen.getByText('formStepper.loading')).toBeInTheDocument();
  });

//   it('validates sections, navigates previous/next, and permits skipping', async () => {
//     renderStepper();
//     fireEvent.click(screen.getByRole('button', { name: 'formStepper.navigation.next' }));
//     expect(await screen.findByText('formStepper.validation.title')).toBeInTheDocument();

//     fireEvent.click(screen.getByRole('button', { name: 'formStepper.navigation.skip' }));
//     expect(useAppStore.getState().currentStep).toBe(1);
//     fireEvent.click(screen.getByRole('button', { name: 'formStepper.navigation.previous' }));
//     expect(useAppStore.getState().currentStep).toBe(0);

//     fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Ada' } });
//     fireEvent.click(screen.getByRole('button', { name: 'formStepper.navigation.next' }));
//     await waitFor(() => expect(useAppStore.getState().currentStep).toBe(1));
//     expect(screen.getByText('Contacts')).toBeInTheDocument();
//   });

//   it('validates table and complex minimum rows before allowing progression', async () => {
//     renderStepper();
//     fireEvent.click(screen.getByText('Contacts'));
//     await waitFor(() => expect(useAppStore.getState().currentStep).toBe(1));
//     fireEvent.click(screen.getByRole('button', { name: 'formStepper.navigation.next' }));
//     expect(await screen.findByText(/This section requires at least 1 complete entry/)).toBeInTheDocument();

//     fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Grace' } });
//     fireEvent.click(screen.getByRole('button', { name: 'formStepper.navigation.next' }));
//     await waitFor(() => expect(useAppStore.getState().currentStep).toBe(2));
//     expect(screen.getByText('Beneficiaries')).toBeInTheDocument();

//     fireEvent.click(screen.getByRole('button', { name: 'formStepper.navigation.next' }));
//     expect(await screen.findByText(/Beneficiaries: Requires at least 1 complete entry/)).toBeInTheDocument();
//   });

  it('opens export confirmation, handles success, and schedules navigation home', async () => {
    renderStepper();
    fireEvent.click(screen.getByText('Estate'));
    await waitFor(() => expect(useAppStore.getState().currentStep).toBe(2));
    useAppStore.getState().updateFormData('Estate', { Beneficiaries: [{ name: 'Ada' }] });
    fireEvent.click(screen.getByRole('button', { name: 'formStepper.navigation.exportData' }));
    expect(await screen.findByText('formStepper.export.warning.message')).toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: 'formStepper.export.confirm' }));
    await waitFor(() => expect(mocks.download).toHaveBeenCalled());
    expect(screen.getByText('formStepper.success.message')).toBeInTheDocument();
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/'), { timeout: 2500 });
  });

  it('shows export errors from Error and non-Error failures', async () => {
    const { unmount } = renderStepper();
    fireEvent.click(screen.getByText('Estate'));
    await waitFor(() => expect(useAppStore.getState().currentStep).toBe(2));
    fireEvent.click(screen.getByRole('button', { name: 'formStepper.navigation.exportData' }));
    await screen.findByRole('button', { name: 'formStepper.export.confirm' });
    mocks.download.mockRejectedValueOnce(new Error('Export failed'));
    fireEvent.click(screen.getByRole('button', { name: 'formStepper.export.confirm' }));
    expect(await screen.findByText('Export failed')).toBeInTheDocument();
    unmount();

    mocks.download.mockRejectedValueOnce('unknown');
    renderStepper();
    fireEvent.click(screen.getByRole('button', { name: 'formStepper.navigation.exportData' }));
    await screen.findByRole('button', { name: 'formStepper.export.confirm' });
    fireEvent.click(screen.getByRole('button', { name: 'formStepper.export.confirm' }));
    expect(await screen.findByText('formStepper.export.error.defaultMessage')).toBeInTheDocument();
  });
});
