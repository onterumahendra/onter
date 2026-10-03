import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { theme } from './theme';

const mockInitializeFromStorage = vi.fn();
const mockCleanupExpiredData = vi.fn();

vi.mock('./utils/indexedDB', () => ({
  cleanupExpiredData: (...args: unknown[]) => mockCleanupExpiredData(...args),
}));

vi.mock('./store/appStore', () => ({
  useAppStore: (selector?: (state: any) => unknown) => {
    const state = {
      initializeFromStorage: mockInitializeFromStorage,
    };
    return typeof selector === 'function' ? selector(state) : state;
  },
}));

vi.mock('./containers/Introduction', () => ({
  Introduction: () => <div>Introduction Page</div>,
}));

vi.mock('./containers/FormStepper', () => ({
  FormStepper: () => <div>Form Page</div>,
}));

const { default: App } = await import('./App');
const renderApp = (initialEntry: string) => render(
  <MantineProvider theme={theme}>
    <MemoryRouter initialEntries={[initialEntry]}>
      <App />
    </MemoryRouter>
  </MantineProvider>,
);

describe('App', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    mockInitializeFromStorage.mockResolvedValue(undefined);
    mockCleanupExpiredData.mockResolvedValue(undefined);
  });

  it('renders the loading state and triggers app initialization', async () => {
    render(
      <MantineProvider theme={theme}>
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      </MantineProvider>,
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockCleanupExpiredData).toHaveBeenCalledTimes(1);
      expect(mockInitializeFromStorage).toHaveBeenCalledTimes(1);
    });
  });

  it('renders the introduction and form routes', async () => {
    const { unmount } = renderApp('/');
    expect(await screen.findByText('Introduction Page')).toBeInTheDocument();

    unmount();
    renderApp('/form');
    expect(await screen.findByText('Form Page')).toBeInTheDocument();
  });

  it('redirects unknown routes to the introduction', async () => {
    renderApp('/unknown');

    expect(await screen.findByText('Introduction Page')).toBeInTheDocument();
  });

  it('prefetches after the delay and clears the timer when unmounted', async () => {
    vi.useFakeTimers();
    const { unmount } = renderApp('/');

    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);

    const secondRender = renderApp('/');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(vi.getTimerCount()).toBe(0);
    secondRender.unmount();
    vi.useRealTimers();
  });
});
