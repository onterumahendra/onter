import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { FormStepper } from './FormStepper';
import { theme } from '../theme';
import { useAppStore } from '../store/appStore';
import type { FormSection } from '../constants/types';

vi.setConfig({ testTimeout: 15_000 });

const mocks = vi.hoisted(() => ({
  sections: [] as FormSection[],
  loading: false,
  mobile: false,
  navigate: vi.fn(),
  download: vi.fn(),
  save: vi.fn(),
  clear: vi.fn(),
}));
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
const emailField = { name: 'email', label: 'Email', type: 'email' as const, validation: { required: true } };
const sections: FormSection[] = [
  { section: 'Personal', type: 'simple', fields: [nameField], description: 'Personal details' },
  { section: 'Contacts', type: 'table', columns: [nameField, emailField], minRows: 2, maxRows: 3 },
  { section: 'Estate', type: 'complex', structure: [{ title: 'Beneficiaries', type: 'table', columns: [nameField, emailField], minRows: 1 }] },
];
const reviewSection: FormSection = { section: 'Review', type: 'simple', fields: [] };
const renderStepper = () => render(<MantineProvider theme={theme}><MemoryRouter><FormStepper /></MemoryRouter></MantineProvider>);
const expectExportWarningClosed = () => {
  const warning = screen.queryByText('formStepper.export.warning.message');
  if (warning) expect(warning).not.toBeVisible();
};

beforeEach(() => {
  vi.useRealTimers();
  mocks.sections = sections;
  mocks.loading = false;
  mocks.mobile = false;
  mocks.navigate.mockReset();
  mocks.download.mockReset().mockResolvedValue(undefined);
  mocks.save.mockReset().mockResolvedValue(undefined);
  mocks.clear.mockReset().mockResolvedValue(undefined);
  useAppStore.getState().reset();
  useAppStore.setState({ saveToIndexedDB: mocks.save, clearData: mocks.clear });
});

describe('FormStepper', () => {
  it('shows loading when configuration is loading or empty', () => {
    mocks.loading = true;
    const { unmount } = renderStepper();
    expect(screen.getByText('formStepper.loading')).toBeInTheDocument();
    expect(screen.getByText('formStepper.loadingDescription')).toBeInTheDocument();
    unmount();

    mocks.loading = false;
    mocks.sections = [];
    renderStepper();
    expect(screen.getByText('formStepper.loading')).toBeInTheDocument();
  });

  it('renders the current section, desktop progress, saved status, and country flag', () => {
    useAppStore.getState().setCountry('US');
    useAppStore.setState({ lastSaveTime: Date.now() });
    renderStepper();

    expect(screen.getByText('Personal details')).toBeInTheDocument();
    expect(screen.getByText('formStepper.progress')).toBeInTheDocument();
    expect(screen.getByText('formStepper.saved')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'US' })).toHaveAttribute('src', expect.stringMatching(/flags\/us\.svg$/));
    expect(screen.getByRole('button', { name: 'formStepper.navigation.previous' })).toBeDisabled();
    fireEvent.click(screen.getByRole('img', { name: 'Onter' }));
    expect(mocks.navigate).toHaveBeenCalledWith('/');
  });

  it('validates simple and table sections and advances with complete rows', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo');
    renderStepper();

    fireEvent.click(screen.getByRole('button', { name: 'formStepper.navigation.next' }));
    expect(screen.getByText('formStepper.validation.title')).toBeInTheDocument();
    expect(screen.getByText(/Name is required/)).toBeInTheDocument();
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    fireEvent.click(screen.getByRole('alert').querySelector('button')!);
    expect(screen.queryByText('formStepper.validation.title')).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), { target: { value: 'Ada' } });
    fireEvent.click(screen.getByRole('button', { name: 'formStepper.navigation.next' }));
    expect(useAppStore.getState().currentStep).toBe(1);
    fireEvent.click(screen.getByRole('button', { name: 'formStepper.navigation.previous' }));
    expect(useAppStore.getState().currentStep).toBe(0);
    expect(screen.queryByText('formStepper.validation.title')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'formStepper.navigation.next' }));
    await waitFor(() => expect(useAppStore.getState().formData.Contacts?.rows).toHaveLength(2));
    fireEvent.click(screen.getByRole('button', { name: 'formStepper.navigation.next' }));
    expect(screen.getByText(/This section requires at least 2 complete entries/)).toBeInTheDocument();

    act(() => useAppStore.getState().updateFormData('Contacts', {
      rows: [{ name: 'Ada', email: '' }, { name: 'Grace', email: 'grace@example.com' }],
    }));
    fireEvent.click(screen.getByRole('button', { name: 'formStepper.navigation.next' }));
    expect(screen.getByText(/Row 1: Email is required/)).toBeInTheDocument();
    expect(screen.getByText(/This section requires at least 2 complete entries/)).toBeInTheDocument();

    act(() => useAppStore.getState().updateFormData('Contacts', {
      rows: [{ name: 'Ada', email: 'ada@example.com' }, { name: 'Grace', email: 'grace@example.com' }],
    }));
    fireEvent.click(screen.getByRole('button', { name: 'formStepper.navigation.next' }));
    expect(useAppStore.getState().currentStep).toBe(2);
  }, 15_000);

  it('supports mobile navigation, skipping, and mobile progress stats', () => {
    mocks.mobile = true;
    renderStepper();
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.queryByText('formStepper.progress')).not.toBeInTheDocument();

    fireEvent.click(document.querySelector('button[data-size="sm"]')!);
    fireEvent.click(screen.getByText('Contacts'));
    expect(useAppStore.getState().currentStep).toBe(1);
    fireEvent.click(screen.getByRole('button', { name: 'formStepper.navigation.previous' }));
    expect(useAppStore.getState().currentStep).toBe(0);
    fireEvent.click(screen.getByRole('button', { name: 'formStepper.navigation.skip' }));
    expect(useAppStore.getState().currentStep).toBe(1);
    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  it('validates complex rows and advances when the subsection is complete', () => {
    mocks.sections = [...sections, reviewSection];
    useAppStore.getState().setStep(2);
    useAppStore.getState().updateFormData('Estate', { Beneficiaries: [{ name: '', email: '' }] });
    expect(useAppStore.getState().currentStep).toBe(2);
    renderStepper();
    expect(useAppStore.getState().currentStep).toBe(2);
    expect(screen.getByRole('heading', { name: 'Estate' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'formStepper.navigation.next' }));
    expect(screen.getByText(/Beneficiaries: Requires at least 1 complete entry/)).toBeInTheDocument();

    act(() => useAppStore.getState().updateFormData('Estate', { Beneficiaries: [{ name: 'Ada', email: '' }] }));
    fireEvent.click(screen.getByRole('button', { name: 'formStepper.navigation.next' }));
    expect(screen.getByText(/Beneficiaries - Row 1: Email is required/)).toBeInTheDocument();

    act(() => useAppStore.getState().updateFormData('Estate', { Beneficiaries: [{ name: 'Ada', email: 'ada@example.com' }] }));
    fireEvent.click(screen.getByRole('button', { name: 'formStepper.navigation.next' }));
    expect(useAppStore.getState().currentStep).toBe(3);
    expect(screen.getByRole('heading', { name: 'Review' })).toBeInTheDocument();
  });

  it('shows mobile auto-save status until saving completes', async () => {
    mocks.mobile = true;
    let finishSaving!: () => void;
    mocks.save.mockImplementation(() => new Promise<void>((resolve) => { finishSaving = resolve; }));
    useAppStore.setState({ formData: { Personal: { name: 'Ada' } } });
    vi.useFakeTimers();
    renderStepper();

    await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
    expect(mocks.save).toHaveBeenCalled();
    expect(screen.getByText('formStepper.saving')).toBeInTheDocument();

    await act(async () => { finishSaving(); await Promise.resolve(); });
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
    expect(screen.queryByText('formStepper.saving')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('cancels and confirms export, then resets and navigates home', async () => {
    const formData = { Personal: { name: 'Ada' } };
    useAppStore.getState().setCountry('IN');
    useAppStore.setState({ formData });
    renderStepper();

    fireEvent.click(screen.getByRole('button', { name: 'formStepper.navigation.next' }));
    expect(useAppStore.getState().currentStep).toBe(1);
    fireEvent.click(screen.getByRole('button', { name: 'formStepper.navigation.skip' }));
    expect(useAppStore.getState().currentStep).toBe(2);
    fireEvent.click(screen.getByRole('button', { name: 'formStepper.navigation.exportData' }));
    expect(await screen.findByText('formStepper.export.warning.message')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'formStepper.export.cancel' }));
    await waitFor(expectExportWarningClosed);

    fireEvent.click(screen.getByRole('button', { name: 'formStepper.navigation.exportData' }));
    await screen.findByText('formStepper.export.warning.message');
    fireEvent.click(screen.getByRole('dialog').querySelector('button')!);
    await waitFor(expectExportWarningClosed);

    fireEvent.click(screen.getByRole('button', { name: 'formStepper.navigation.exportData' }));
    await screen.findByText('formStepper.export.warning.message');
    const expectedFormData = useAppStore.getState().formData;
    vi.useFakeTimers();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'formStepper.export.confirm' }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mocks.download).toHaveBeenCalledWith(expectedFormData, 'IN', new Set([0, 2]), new Set([1]));
    expect(mocks.clear).toHaveBeenCalledOnce();
    expect(useAppStore.getState().currentStep).toBe(0);
    expect(screen.getByText('formStepper.success.message')).toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(250); });
    expectExportWarningClosed();
    fireEvent.click(document.querySelector('button.mantine-Notification-closeButton')!);
    expect(screen.queryByText('formStepper.success.message')).not.toBeInTheDocument();

    await act(async () => { await vi.advanceTimersByTimeAsync(1750); });
    expect(mocks.navigate).toHaveBeenCalledWith('/');
    vi.useRealTimers();
  }, 15_000);

  it('shows export errors from Error and non-Error failures', async () => {
    useAppStore.getState().setStep(2);
    mocks.download.mockRejectedValueOnce(new Error('Export failed'));
    const { unmount } = renderStepper();
    fireEvent.click(screen.getByRole('button', { name: 'formStepper.navigation.exportData' }));
    await screen.findByRole('button', { name: 'formStepper.export.confirm' });
    fireEvent.click(screen.getByRole('button', { name: 'formStepper.export.confirm' }));
    expect(await screen.findByText('Export failed')).toBeInTheDocument();
    expect(screen.getByText('formStepper.export.warning.message')).toBeInTheDocument();
    fireEvent.click(document.querySelector('button.mantine-Notification-closeButton')!);
    expect(screen.queryByText('Export failed')).not.toBeInTheDocument();
    unmount();

    mocks.download.mockRejectedValueOnce('unknown');
    renderStepper();
    fireEvent.click(screen.getByRole('button', { name: 'formStepper.navigation.exportData' }));
    await screen.findByRole('button', { name: 'formStepper.export.confirm' });
    fireEvent.click(screen.getByRole('button', { name: 'formStepper.export.confirm' }));
    expect(await screen.findByText('formStepper.export.error.defaultMessage')).toBeInTheDocument();
  });
});
