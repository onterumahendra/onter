/* eslint-disable @typescript-eslint/no-explicit-any */

import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router-dom';
import { theme } from '../theme';
import { brand } from '../branding';

const mockNavigate = vi.fn();
const mockLoadFromIndexedDB = vi.fn();
const mockClearData = vi.fn();
const mockSetImportMode = vi.fn();
const mockUpdateFormData = vi.fn();
const mockGenerateTemplate = vi.fn();
const mockImportData = vi.fn();
let mockSelectedCountry = 'US';
const mockSetCountry = vi.fn((country: string) => {
  mockSelectedCountry = country;
});

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next');
  const t = (key: string) => key;
  return {
    ...actual,
    useTranslation: () => ({ t, i18n: { language: 'en' } }),
  };
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@mantine/hooks', async () => {
  const actual = await vi.importActual<typeof import('@mantine/hooks')>('@mantine/hooks');
  return {
    ...actual,
    useMediaQuery: () => false,
  };
});

vi.mock('../constants', () => ({
  getAvailableCountries: () => [
    { code: 'US', name: 'United States' },
    { code: 'IN', name: 'India' },
  ],
}));

vi.mock('../store/appStore', () => ({
  useAppStore: (selector?: (state: any) => unknown) => {
    const state = {
      selectedCountry: mockSelectedCountry,
      setCountry: mockSetCountry,
      setImportMode: mockSetImportMode,
      updateFormData: mockUpdateFormData,
      loadFromIndexedDB: mockLoadFromIndexedDB,
      clearData: mockClearData,
      lastSaveTime: 123,
    };
    return typeof selector === 'function' ? selector(state) : state;
  },
}));

vi.mock('../hooks/useExcelOperations', () => ({
  useExcelOperations: () => ({
    isGenerating: false,
    isImporting: false,
    generateTemplate: mockGenerateTemplate,
    importData: mockImportData,
  }),
}));

vi.mock('../utils/paths', () => ({
  publicAsset: (path: string) => `/assets/${path}`,
}));

const { Introduction } = await import('./Introduction');

describe('Introduction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectedCountry = 'US';
    mockGenerateTemplate.mockResolvedValue(undefined);
    mockImportData.mockResolvedValue({ personalInfo: { name: 'Jane' } });
    mockClearData.mockResolvedValue(undefined);
    mockLoadFromIndexedDB.mockResolvedValue(false);
  });

  it('renders the introduction screen and checks for data belonging to the selected country', async () => {
    render(
      <MantineProvider theme={theme}>
        <MemoryRouter>
          <Introduction />
        </MemoryRouter>
      </MantineProvider>,
    );

    expect(screen.getByText(brand.tagline)).toBeInTheDocument();
    await waitFor(() => expect(mockLoadFromIndexedDB).toHaveBeenCalledWith('US'));
    expect(screen.queryByRole('button', { name: 'introduction.start.resumeSession' })).not.toBeInTheDocument();
  });

  it('hides the resume card when switching to a country without saved data', async () => {
    mockLoadFromIndexedDB.mockImplementation(async (country: string) => country === 'US');

    const renderIntroduction = () => (
      <MantineProvider theme={theme}>
        <MemoryRouter>
          <Introduction />
        </MemoryRouter>
      </MantineProvider>
    );
    const { rerender } = render(renderIntroduction());
    await screen.findByRole('button', { name: 'introduction.start.resumeSession' });

    act(() => mockSetCountry('IN'));
    rerender(renderIntroduction());

    await waitFor(() => {
      expect(mockLoadFromIndexedDB).toHaveBeenLastCalledWith('IN');
      expect(screen.queryByRole('button', { name: 'introduction.start.resumeSession' })).not.toBeInTheDocument();
    });
  });

  it('navigates to the form without import when manual entry is selected', async () => {
    mockLoadFromIndexedDB.mockResolvedValue(false);

    render(
      <MantineProvider theme={theme}>
        <MemoryRouter>
          <Introduction />
        </MemoryRouter>
      </MantineProvider>,
    );

    await waitFor(() => expect(
      screen.getByRole('button', { name: 'introduction.start.manualEntry' }),
    ).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'introduction.start.manualEntry' }));

    expect(mockNavigate).toHaveBeenCalledWith('/form');
    expect(mockSetImportMode).toHaveBeenCalledWith(false);
  });

  it('downloads the template when the template action is triggered', () => {
    render(
      <MantineProvider theme={theme}>
        <MemoryRouter>
          <Introduction />
        </MemoryRouter>
      </MantineProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'introduction.start.downloadTemplate' }));

    expect(mockGenerateTemplate).toHaveBeenCalledTimes(1);
  });

  it('shows a saved-session resume card and confirms when clearing stale data', async () => {
    mockLoadFromIndexedDB.mockResolvedValue(true);

    render(
      <MantineProvider theme={theme}>
        <MemoryRouter>
          <Introduction />
        </MemoryRouter>
      </MantineProvider>,
    );

    await waitFor(() => {
      expect(screen.getAllByText('introduction.start.resumeSession').length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole('button', { name: 'introduction.start.manualEntry' }));
    await waitFor(() => {
      expect(screen.getByText('introduction.start.confirmClear.message')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'introduction.start.confirmClear.confirm' }));

    await waitFor(() => {
      expect(mockClearData).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/form');
      expect(mockSetImportMode).toHaveBeenCalledWith(false);
    });
  }, 15_000);

  it('resumes only after the selected country session is loaded', async () => {
    mockLoadFromIndexedDB.mockResolvedValue(true);

    render(
      <MantineProvider theme={theme}>
        <MemoryRouter>
          <Introduction />
        </MemoryRouter>
      </MantineProvider>,
    );

    const resumeButton = await screen.findByRole('button', { name: 'introduction.start.resumeSession' });
    fireEvent.click(resumeButton);

    await waitFor(() => {
      expect(mockLoadFromIndexedDB).toHaveBeenLastCalledWith('US');
      expect(mockNavigate).toHaveBeenCalledWith('/form');
    });
  });

  it('resumes saved data and cancels or confirms a saved-session import', async () => {
    mockLoadFromIndexedDB.mockResolvedValue(true);
    const { container } = render(
      <MantineProvider theme={theme}>
        <MemoryRouter>
          <Introduction />
        </MemoryRouter>
      </MantineProvider>,
    );
    await screen.findAllByText('introduction.start.resumeSession');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'introduction.start.resumeSession' }));
    });
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/form'));

    const file = new File(['test'], 'import.xlsx', { type: 'application/vnd.ms-excel' });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'introduction.start.importContinue' }));
    await screen.findByText('introduction.start.confirmClear.message');
    fireEvent.click(screen.getByRole('button', { name: 'introduction.start.confirmClear.cancel' }));
    expect(mockClearData).not.toHaveBeenCalled();
    expect(await screen.findByRole('button', { name: 'introduction.start.importExcel' })).toBeInTheDocument();

    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'introduction.start.importContinue' }));
    await screen.findByText('introduction.start.confirmClear.message');
    fireEvent.click(screen.getByRole('button', { name: 'introduction.start.confirmClear.confirm' }));
    await waitFor(() => {
      expect(mockClearData).toHaveBeenCalledTimes(1);
      expect(mockImportData).toHaveBeenCalledWith(file);
      expect(mockUpdateFormData).toHaveBeenCalledWith('personalInfo', { name: 'Jane' });
      expect(mockSetImportMode).toHaveBeenCalledWith(true);
    });
  }, 15_000);

  it('shows a template generation error when the export fails', async () => {
    mockGenerateTemplate.mockRejectedValue(new Error('Template generation failed'));

    render(
      <MantineProvider theme={theme}>
        <MemoryRouter>
          <Introduction />
        </MemoryRouter>
      </MantineProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'introduction.start.downloadTemplate' }));

    await waitFor(() => {
      expect(screen.getByText('introduction.errors.templateFailed')).toBeInTheDocument();
    });
  });

  it('shows an import error when the file import fails', async () => {
    mockImportData.mockRejectedValue(new Error('Import failed'));

    render(
      <MantineProvider theme={theme}>
        <MemoryRouter>
          <Introduction />
        </MemoryRouter>
      </MantineProvider>,
    );

    await waitFor(() => expect(
        screen.getByRole('button', { name: 'introduction.start.importExcel' }),
    ).toBeEnabled());
    const file = new File(['test'], 'import.xlsx', { type: 'application/vnd.ms-excel' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement | null;

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'introduction.start.importContinue' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: 'introduction.start.importContinue' }));

      await waitFor(() => {
        expect(screen.getByText('Import failed')).toBeInTheDocument();
      });
    }
  });

  it('imports the selected file and redirects to the form when valid data is provided', async () => {
    render(
      <MantineProvider theme={theme}>
        <MemoryRouter>
          <Introduction />
        </MemoryRouter>
      </MantineProvider>,
    );

    await waitFor(() => expect(
        screen.getByRole('button', { name: 'introduction.start.importExcel' }),
    ).toBeEnabled());
    const file = new File(['test'], 'import.xlsx', { type: 'application/vnd.ms-excel' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement | null;

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'introduction.start.importContinue' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: 'introduction.start.importContinue' }));

      await waitFor(() => {
        expect(mockImportData).toHaveBeenCalledWith(file);
        expect(mockSetImportMode).toHaveBeenCalledWith(true);
        expect(mockNavigate).toHaveBeenCalledWith('/form');
      });
    }
  });
});
