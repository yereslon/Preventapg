import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';

// jsdom no implementa ResizeObserver ni IntersectionObserver (los usa Headless UI v2)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

global.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof IntersectionObserver;
