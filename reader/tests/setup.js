// Test setup file for Vitest
import { beforeAll, afterEach, vi } from 'vitest';

// Mock browser APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IndexedDB
const indexedDBMock = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
  cmp: vi.fn(),
  databases: vi.fn()
};

Object.defineProperty(window, 'indexedDB', {
  writable: true,
  value: indexedDBMock
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  writable: true,
  value: localStorageMock
});

// Mock performance API
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByName: vi.fn(() => []),
    now: vi.fn(() => Date.now())
  }
});

// Mock requestAnimationFrame
Object.defineProperty(window, 'requestAnimationFrame', {
  writable: true,
  value: vi.fn(cb => setTimeout(cb, 16))
});

// Mock cancelAnimationFrame
Object.defineProperty(window, 'cancelAnimationFrame', {
  writable: true,
  value: vi.fn(id => clearTimeout(id))
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock DOMParser for Node environment
if (typeof DOMParser === 'undefined') {
  global.DOMParser = class DOMParser {
    parseFromString(str, contentType) {
      // Basic mock - in real tests you might want to use jsdom or happy-dom
      return {
        documentElement: {
          querySelector: vi.fn(),
          querySelectorAll: vi.fn(() => []),
          textContent: str
        },
        querySelector: vi.fn(),
        querySelectorAll: vi.fn(() => []),
        getElementsByTagName: vi.fn(() => []),
      };
    }
  };
}

// Mock TextDecoder for encoding tests
global.TextDecoder = class TextDecoder {
  constructor(encoding = 'utf-8') {
    this.encoding = encoding;
  }

  decode(buffer) {
    // Basic mock - return string representation
    if (buffer instanceof ArrayBuffer) {
      return String.fromCharCode.apply(null, new Uint8Array(buffer));
    }
    return buffer.toString();
  }
};

// Mock TextEncoder
global.TextEncoder = class TextEncoder {
  encode(str) {
    return new Uint8Array(str.split('').map(c => c.charCodeAt(0)));
  }
};

// Mock fetch for HTTP requests
global.fetch = vi.fn();

// Mock URL.createObjectURL
Object.defineProperty(window.URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'mock-object-url')
});

// Mock URL.revokeObjectURL
Object.defineProperty(window.URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn()
});

// Mock Blob
global.Blob = vi.fn().mockImplementation((content, options) => ({
  content,
  options,
  size: content ? content.join('').length : 0,
  type: options?.type || '',
  text: vi.fn().mockResolvedValue(content ? content.join('') : ''),
  arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
  slice: vi.fn().mockReturnValue(new Blob()),
  stream: vi.fn()
}));

// Mock File
global.File = vi.fn().mockImplementation((content, filename, options) => ({
  ...new Blob(content, options),
  name: filename,
  lastModified: Date.now(),
  lastModifiedDate: new Date(),
  webkitRelativePath: ''
}));

// Mock FileReader
global.FileReader = vi.fn().mockImplementation(() => ({
  readAsText: vi.fn(function(blob) {
    // Simulate async reading
    setTimeout(() => {
      if (blob && blob.text) {
        this.result = blob.text();
        this.onload && this.onload({ target: { result: this.result } });
      } else {
        this.result = 'mock file content';
        this.onload && this.onload({ target: { result: this.result } });
      }
    }, 0);
  }),
  readAsArrayBuffer: vi.fn(function(blob) {
    setTimeout(() => {
      this.result = new ArrayBuffer(8);
      this.onload && this.onload({ target: { result: this.result } });
    }, 0);
  }),
  abort: vi.fn(),
  onload: null,
  onerror: null,
  onabort: null,
  readyState: 0,
  EMPTY: 0,
  LOADING: 1,
  DONE: 2
}));

// Mock Worker
global.Worker = vi.fn().mockImplementation(() => ({
  postMessage: vi.fn(),
  terminate: vi.fn(),
  onmessage: null,
  onerror: null
}));

// Mock Service Worker
Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: {
    register: vi.fn().mockResolvedValue({
      scope: '/',
      update: vi.fn(),
      unregister: vi.fn()
    }),
    ready: Promise.resolve(),
    controller: null,
    oncontrollerchange: null,
    onmessage: null
  }
});

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  writable: true,
  value: {
    permission: 'granted',
    requestPermission: vi.fn().mockResolvedValue('granted')
  }
});

// Global test utilities
global.createMockFile = (name = 'test.fb2', content = '<xml></xml>', type = 'text/xml') => {
  return new File([content], name, { type });
};

global.createMockBook = (overrides = {}) => {
  return {
    id: 'book-123',
    title: 'Test Book',
    author: 'Test Author',
    description: 'Test description',
    file: 'test.fb2',
    format: 'fb2',
    source: 'upload',
    uploadedAt: Date.now(),
    size: 1024,
    wordCount: 100,
    ...overrides
  };
};

global.createMockContainer = () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  return container;
};

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();

  // Clean up any DOM elements added during tests
  const testContainers = document.querySelectorAll('[data-testid]');
  testContainers.forEach(container => container.remove());
});
