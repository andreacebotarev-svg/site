# 📚 Reader Usage Examples

Comprehensive examples of how to use the Reader application and its components.

## 🚀 Getting Started

### Basic Setup

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reader App</title>
  <link rel="stylesheet" href="assets/css/base.css">
  <link rel="stylesheet" href="assets/css/components/toast.css">
</head>
<body>
  <div id="app"></div>

  <script type="module">
    import { Application } from './assets/js/core/Application.js';

    const app = new Application({
      root: document.getElementById('app'),
      logLevel: 'info'
    });

    app.bootstrap().catch(console.error);
  </script>
</body>
</html>
```

## 📖 Using the BookService

### Loading Books

```javascript
import { bookService } from './assets/js/services/book-service.js';

// Get all books
async function loadLibrary() {
  try {
    const books = await bookService.getAllBooks();
    console.log(`Loaded ${books.length} books`);

    books.forEach(book => {
      console.log(`${book.title} by ${book.author}`);
    });

    return books;
  } catch (error) {
    console.error('Failed to load books:', error);
    return [];
  }
}

// Get specific book
async function getBookDetails(bookId) {
  const book = await bookService.getBook(bookId);
  if (!book) {
    throw new Error('Book not found');
  }

  return {
    id: book.id,
    title: book.title,
    author: book.author,
    format: book.format,
    size: `${(book.size / 1024 / 1024).toFixed(1)}MB`
  };
}
```

### Adding Books

```javascript
// Add book from file input
async function addBookFromFile(file) {
  try {
    // Parse the file
    const content = await bookService.parseContent(file, file.name.split('.').pop());

    // Create book metadata
    const book = {
      id: `book-${Date.now()}`,
      title: content.metadata.title || file.name.replace(/\.[^/.]+$/, ""),
      author: content.metadata.author || 'Unknown',
      description: content.metadata.description,
      file: file,
      format: file.name.split('.').pop().toLowerCase(),
      source: 'upload',
      uploadedAt: Date.now(),
      size: file.size,
      wordCount: content.wordCount
    };

    // Save to library
    const savedBook = await bookService.addBook(book);

    console.log('Book added:', savedBook.title);
    return savedBook;

  } catch (error) {
    console.error('Failed to add book:', error);
    throw error;
  }
}
```

### Loading Book Content

```javascript
async function displayBook(bookId) {
  try {
    const content = await bookService.loadBookContent(bookId);

    // Update page title
    document.title = `${content.metadata.title} - Reader`;

    // Render content
    const readerElement = document.getElementById('reader');
    readerElement.innerHTML = `
      <div class="book-header">
        <h1>${content.metadata.title}</h1>
        <p class="author">by ${content.metadata.author}</p>
        <p class="description">${content.metadata.description}</p>
      </div>

      <div class="book-content">
        ${content.html}
      </div>

      <div class="book-sections">
        <h3>Table of Contents</h3>
        <ul>
          ${content.sections.map(section => `
            <li>
              <a href="#section-${section.id}">
                ${section.title || `Section ${section.id}`}
              </a>
            </li>
          `).join('')}
        </ul>
      </div>
    `;

  } catch (error) {
    console.error('Failed to load book content:', error);
    showError('Unable to load book content');
  }
}
```

## 🎨 Using UI Components

### Toast Notifications

```javascript
import { toastManager } from './assets/js/ui/managers/ToastManager.js';

// Success notification
function showSuccess(message) {
  toastManager.success(message, {
    title: 'Success',
    duration: 3000
  });
}

// Error with retry action
function showErrorWithRetry(message, retryFunction) {
  toastManager.error(message, {
    title: 'Error',
    duration: 0, // Don't auto-dismiss
    actions: [
      {
        label: 'Retry',
        variant: 'primary',
        onClick: retryFunction
      },
      {
        label: 'Dismiss',
        variant: 'secondary'
      }
    ]
  });
}

// Progress notification
function showProgress(message) {
  const toastId = toastManager.info(message, {
    title: 'Processing',
    duration: 0 // Manual dismiss only
  });

  return toastId;
}

// Usage
async function uploadBook(file) {
  const progressToastId = showProgress('Uploading book...');

  try {
    await addBookFromFile(file);
    toastManager.dismiss(progressToastId);
    showSuccess('Book uploaded successfully!');
  } catch (error) {
    toastManager.dismiss(progressToastId);
    showErrorWithRetry('Upload failed', () => uploadBook(file));
  }
}
```

### DropZone for File Uploads

```javascript
import { DropZone } from './assets/js/ui/components/DropZone.js';
import { toastManager } from './assets/js/ui/managers/ToastManager.js';

function setupFileUpload() {
  const container = document.getElementById('upload-zone');

  const dropzone = new DropZone(container, {
    accept: ['.fb2', '.epub', '.txt'],
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true,
    onUpload: async (file, index, total) => {
      try {
        console.log(`Processing ${file.name} (${index + 1}/${total})`);

        // Show progress
        toastManager.info(`Processing ${file.name}...`, {
          title: 'Upload Progress',
          duration: 0
        });

        // Process file
        const book = await addBookFromFile(file);

        // Show success
        toastManager.success(`${file.name} added to library`, {
          duration: 2000
        });

        return book;

      } catch (error) {
        toastManager.error(`Failed to process ${file.name}: ${error.message}`, {
          title: 'Upload Error',
          duration: 0,
          actions: [{
            label: 'Retry',
            onClick: () => addBookFromFile(file)
          }]
        });
        throw error;
      }
    },
    onError: (errors) => {
      errors.forEach(error => {
        toastManager.error(error, {
          title: 'Upload Error'
        });
      });
    }
  });

  return dropzone;
}
```

### Modal Dialogs

```javascript
import { modalManager } from './assets/js/ui/managers/ModalManager.js';

function confirmDelete(bookTitle, deleteCallback) {
  modalManager.show({
    title: 'Confirm Delete',
    content: `
      <p>Are you sure you want to delete "${bookTitle}"?</p>
      <p class="text-secondary">This action cannot be undone.</p>
    `,
    actions: [
      {
        label: 'Delete',
        variant: 'danger',
        onClick: () => {
          deleteCallback();
          modalManager.close();
        }
      },
      {
        label: 'Cancel',
        variant: 'secondary',
        onClick: () => modalManager.close()
      }
    ]
  });
}

// Usage
function deleteBook(bookId, bookTitle) {
  confirmDelete(bookTitle, async () => {
    try {
      await bookService.removeBook(bookId);
      toastManager.success('Book deleted successfully');
      // Refresh library view
      loadLibrary();
    } catch (error) {
      toastManager.error('Failed to delete book');
    }
  });
}
```

### Loading States with Skeleton

```javascript
import { Skeleton } from './assets/js/ui/components/Skeleton.js';

async function loadBookLibrary() {
  const container = document.getElementById('library');

  // Show skeleton loading
  container.innerHTML = `
    <div class="library-header">
      <h1>Library</h1>
    </div>
    ${Skeleton.bookGrid(8)}
  `;

  try {
    const books = await bookService.getAllBooks();

    // Replace with real content
    container.innerHTML = `
      <div class="library-header">
        <h1>Library</h1>
      </div>
      <div class="books-grid">
        ${books.map(book => renderBookCard(book)).join('')}
      </div>
    `;

  } catch (error) {
    container.innerHTML = `
      <div class="error-state">
        <h2>Failed to load library</h2>
        <p>${error.message}</p>
        <button onclick="loadBookLibrary()">Retry</button>
      </div>
    `;
  }
}

function renderBookCard(book) {
  return `
    <div class="book-card" data-book-id="${book.id}">
      <div class="book-cover">${book.cover || '📖'}</div>
      <h3 class="book-title">${escapeHtml(book.title)}</h3>
      <p class="book-author">${escapeHtml(book.author || 'Unknown')}</p>
      <div class="book-meta">
        <span>${book.wordCount ? formatNumber(book.wordCount) : 'Unknown'} words</span>
        <span>${book.format.toUpperCase()}</span>
      </div>
    </div>
  `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
```

## 📖 Custom Parsers

### Creating a Custom Format Parser

```javascript
// assets/js/parsers/custom-parser.js
export class CustomParser {
  constructor() {
    this.parser = new DOMParser();
  }

  async parse(file) {
    const text = await file.text();
    const content = this.parseCustomFormat(text);

    return {
      html: content.html,
      sections: content.sections,
      metadata: content.metadata,
      wordCount: content.wordCount
    };
  }

  parseCustomFormat(text) {
    // Custom parsing logic here
    // Return same format as FB2Parser
    return {
      html: '<div>Parsed content</div>',
      sections: [{ id: 'section-1', title: 'Main', wordCount: 100 }],
      metadata: { title: 'Custom Book', author: 'Unknown' },
      wordCount: 100
    };
  }
}

// Integration in BookService
// In parseContent method:
case 'custom':
  const customParser = new CustomParser();
  return customParser.parse(data);
```

### Extending FB2 Parser

```javascript
// Custom FB2 parser with additional features
import { FB2Parser } from './fb2-parser.js';

export class EnhancedFB2Parser extends FB2Parser {
  async parse(file) {
    const result = await super.parse(file);

    // Add custom processing
    result.metadata.genre = this.extractGenre(result.xmlDoc);
    result.metadata.rating = this.extractRating(result.xmlDoc);

    return result;
  }

  extractGenre(xmlDoc) {
    return xmlDoc.querySelector('genre')?.textContent || 'Unknown';
  }

  extractRating(xmlDoc) {
    // Custom rating extraction logic
    return 5; // Default rating
  }
}
```

## 🧪 Testing Examples

### Component Testing

```javascript
// tests/components/DropZone.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DropZone } from '../../assets/js/ui/components/DropZone.js';

describe('DropZone', () => {
  let container;
  let dropzone;

  beforeEach(() => {
    container = document.createElement('div');
    dropzone = new DropZone(container, {
      accept: ['.fb2', '.txt'],
      onUpload: vi.fn(),
      onError: vi.fn()
    });
  });

  afterEach(() => {
    dropzone.destroy();
  });

  it('should render dropzone interface', () => {
    expect(container.querySelector('.dropzone')).toBeTruthy();
    expect(container.querySelector('.dropzone-icon')).toBeTruthy();
  });

  it('should accept valid files', () => {
    const validFile = new File(['content'], 'book.fb2', { type: 'text/xml' });
    const invalidFile = new File(['content'], 'document.pdf', { type: 'application/pdf' });

    // Mock the file input change
    const input = container.querySelector('input[type="file"]');
    Object.defineProperty(input, 'files', {
      value: [validFile, invalidFile]
    });
    input.dispatchEvent(new Event('change'));

    expect(dropzone.options.onUpload).toHaveBeenCalledWith(validFile, 0, 1);
    expect(dropzone.options.onError).toHaveBeenCalledWith([
      'document.pdf: Invalid format. Supported: .fb2,.txt'
    ]);
  });

  it('should handle drag and drop', () => {
    const file = new File(['content'], 'book.fb2');
    const dropEvent = new DragEvent('drop');
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: { files: [file] }
    });

    dropzone.dropzone.dispatchEvent(dropEvent);

    expect(dropzone.options.onUpload).toHaveBeenCalledWith(file, 0, 1);
  });
});
```

### Service Testing

```javascript
// tests/services/book-service.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BookService } from '../../assets/js/services/book-service.js';

describe('BookService', () => {
  let bookService;

  beforeEach(() => {
    bookService = new BookService();
    // Mock IndexedDB
    vi.mock('indexeddb');
  });

  it('should parse FB2 content', async () => {
    const xml = `
      <?xml version="1.0" encoding="utf-8"?>
      <FictionBook>
        <description>
          <title-info>
            <book-title>Test Book</book-title>
            <author><first-name>John</first-name><last-name>Doe</last-name></author>
          </title-info>
        </description>
        <body>
          <section>
            <title><p>Chapter 1</p></title>
            <p>This is test content.</p>
          </section>
        </body>
      </FictionBook>
    `;

    const file = new Blob([xml], { type: 'text/xml' });
    const result = await bookService.parseContent(file, 'fb2');

    expect(result.metadata.title).toBe('Test Book');
    expect(result.metadata.author).toBe('John Doe');
    expect(result.sections).toHaveLength(1);
    expect(result.html).toContain('<h3>Chapter 1</h3>');
  });

  it('should handle parsing errors', async () => {
    const invalidXml = '<invalid xml>';
    const file = new Blob([invalidXml], { type: 'text/xml' });

    await expect(bookService.parseContent(file, 'fb2'))
      .rejects.toThrow('XML Parsing Error');
  });

  it('should cache parsed content', async () => {
    const xml = '<FictionBook><body><section><p>Test</p></section></body></FictionBook>';
    const file = new Blob([xml]);

    // First parse
    const result1 = await bookService.parseContent(file, 'fb2');

    // Should be cached
    expect(bookService.contentCache.has('test-id')).toBeTruthy();

    // Second parse should use cache (if implemented)
    // This depends on your caching strategy
  });
});
```

## 🚀 Advanced Usage

### Custom Theme Implementation

```css
/* custom-theme.css */
:root {
  --primary-color: #8B5CF6;    /* Purple theme */
  --accent-color: #10B981;     /* Green accents */
  --danger-color: #EF4444;     /* Red errors */
  --bg-primary: #1F2937;       /* Dark background */
  --text-primary: #F9FAFB;     /* Light text */
}

/* Override component styles */
.toast {
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.dropzone {
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
}
```

### Performance Optimization

```javascript
// Implement virtual scrolling for large book lists
class VirtualBookList {
  constructor(container, books) {
    this.container = container;
    this.books = books;
    this.visibleItems = 20;
    this.scrollTop = 0;

    this.setupVirtualization();
  }

  setupVirtualization() {
    this.container.addEventListener('scroll', this.handleScroll.bind(this));
    this.render();
  }

  handleScroll() {
    const scrollTop = this.container.scrollTop;
    const itemHeight = 100; // Approximate height
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = startIndex + this.visibleItems;

    this.render(startIndex, endIndex);
  }

  render(start = 0, end = this.visibleItems) {
    const visibleBooks = this.books.slice(start, end);
    const offsetY = start * 100;

    this.container.innerHTML = `
      <div style="height: ${this.books.length * 100}px; position: relative;">
        <div style="transform: translateY(${offsetY}px);">
          ${visibleBooks.map(book => renderBookCard(book)).join('')}
        </div>
      </div>
    `;
  }
}
```

### Offline-First Implementation

```javascript
// Service worker for offline caching
// service-worker.js
const CACHE_NAME = 'reader-v1.0.0';
const API_CACHE = 'reader-api-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        './',
        './index.html',
        './assets/css/base.css',
        './assets/js/core/Application.js'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Cache-first for static assets
  if (event.request.url.includes('/assets/')) {
    event.respondWith(cacheFirst(event.request));
  }
  // Network-first for API calls
  else if (event.request.url.includes('/api/')) {
    event.respondWith(networkFirst(event.request));
  }
});

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  return cached || fetch(request);
}

async function networkFirst(request) {
  const cache = await caches.open(API_CACHE);

  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    return cache.match(request);
  }
}
```

### Analytics Integration

```javascript
// Analytics tracking
class Analytics {
  static trackEvent(event, data) {
    // Send to analytics service
    console.log('Analytics:', event, data);

    // Example: Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', event, data);
    }
  }

  static trackBookOpen(bookId, format) {
    this.trackEvent('book_open', {
      book_id: bookId,
      format: format,
      timestamp: Date.now()
    });
  }

  static trackUpload(format, size, duration) {
    this.trackEvent('book_upload', {
      format,
      size_mb: (size / 1024 / 1024).toFixed(2),
      duration_ms: duration
    });
  }
}

// Usage in components
async function openBook(bookId) {
  const startTime = Date.now();

  try {
    await displayBook(bookId);
    Analytics.trackBookOpen(bookId, 'fb2');
  } catch (error) {
    Analytics.trackEvent('book_open_error', {
      book_id: bookId,
      error: error.message
    });
  }
}
```

These examples demonstrate the full range of Reader's capabilities and how to extend and customize the application for specific use cases.
