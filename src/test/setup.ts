import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock console.log to avoid noise in tests
globalThis.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Setup for Three.js in test environment
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn();
  HTMLCanvasElement.prototype.toDataURL = vi.fn();
}
