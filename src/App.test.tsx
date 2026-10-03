import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

const { default: App } = await import('./App');

describe('App', () => {
  beforeEach(() => {
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
});
