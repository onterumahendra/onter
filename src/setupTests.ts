import '@testing-library/jest-dom/vitest';
import { TextEncoder, TextDecoder } from 'node:util';

if (!globalThis.TextEncoder) {
  Object.defineProperty(globalThis, 'TextEncoder', {
    value: TextEncoder,
    configurable: true,
  });
}

if (!globalThis.TextDecoder) {
  Object.defineProperty(globalThis, 'TextDecoder', {
    value: TextDecoder,
    configurable: true,
  });
}

if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (!document.fonts) {
  Object.defineProperty(document, 'fonts', {
    configurable: true,
    value: {
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    },
  });
}

Object.defineProperty(window, 'scrollTo', {
  configurable: true,
  value: () => undefined,
});
