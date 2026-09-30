import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';
import { theme } from '../theme';

let shouldThrow = true;
function FailingChild() {
  if (shouldThrow) throw new Error('render failed');
  return <div>Recovered child</div>;
}

const renderBoundary = (fallback?: React.ReactNode) => render(
  <MantineProvider theme={theme}>
    <ErrorBoundary fallback={fallback}><FailingChild /></ErrorBoundary>
  </MantineProvider>,
);

afterEach(() => {
  shouldThrow = true;
  vi.restoreAllMocks();
});

describe('ErrorBoundary', () => {
  it('renders a custom fallback after a child error', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderBoundary(<div>Custom error screen</div>);
    expect(screen.getByText('Custom error screen')).toBeInTheDocument();
  });

  it('renders the default recovery UI and resets after the child recovers', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderBoundary();
    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(screen.getByText('Recovered child')).toBeInTheDocument();
  });

  it('shows error details in development mode', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubEnv('NODE_ENV', 'development');
    renderBoundary();
    expect(screen.getByText('Error Details (Development Only)')).toBeInTheDocument();
    expect(screen.getByText('Error: render failed')).toBeInTheDocument();
  });
});
