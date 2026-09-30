import { beforeEach, describe, expect, it, vi } from 'vitest';

const roots = vi.hoisted(() => ({ createRoot: vi.fn(), render: vi.fn() }));
vi.mock('react-dom/client', () => ({ createRoot: roots.createRoot }));
vi.mock('./App', () => ({ default: () => null }));
vi.mock('./components/ErrorBoundary', () => ({ ErrorBoundary: ({ children }: { children: unknown }) => children }));

beforeEach(() => {
  vi.resetModules();
  roots.render.mockReset();
  roots.createRoot.mockReturnValue({ render: roots.render });
  document.body.innerHTML = '<div id="root"></div>';
});

describe('application entry point', () => {
  it('mounts the application into the root element', async () => {
    await import('./main');
    expect(roots.createRoot).toHaveBeenCalledWith(document.getElementById('root'));
    expect(roots.render).toHaveBeenCalledTimes(1);
  }, 15000);
});
