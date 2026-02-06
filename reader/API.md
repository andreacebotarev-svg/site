# 📋 Reader API Reference

Complete API documentation for the Reader application components and services.

**📢 Post-Refactoring Update**: This API reference now includes the new component-based architecture introduced in version 3.0.0.

## 🏗️ Component Architecture (v3.0+)

### ReaderView (Main Orchestrator)

The main reading view that coordinates all reading-related components.

#### Constructor
```javascript
import { ReaderView } from './assets/js/views/ReaderView.js';

const readerView = new ReaderView(container, [bookId]);
```

#### Methods

##### `async render(): Promise<void>`
Render the reading view and load book content.

**Example:**
```javascript
await readerView.render(); // Loads and displays book
```

##### `destroy(): void`
Clean up all resources and destroy the view.

**Example:**
```javascript
readerView.destroy(); // Cleanup all components
```

##### `getStats(): Object`
Get comprehensive statistics about the current reading session.

**Returns:**
```javascript
{
  bookId: "book-123",
  pagination: { /* pagination stats */ },
  content: { /* content stats */ },
  ui: "ready" // UI state
}
```

### ContentRenderer

Handles rendering of book content with support for different formats.

#### Constructor
```javascript
import { ContentRenderer } from './assets/js/reader/ContentRenderer.js';

const renderer = new ContentRenderer({
  enableImages: true,
  enableInteractiveWords: true
});
```

#### Methods

##### `async renderBookContent(content: Object, bookId: string): Promise<string>`
Render complete book content as HTML.

**Parameters:**
- `content: Object` - Parsed book content
- `bookId: string` - Book identifier for image loading

**Returns:** HTML string

##### `cleanupBlobUrls(): void`
Clean up any blob URLs created during rendering.

### WordHighlighter

Manages interactive word highlighting and popover interactions.

#### Constructor
```javascript
import { WordHighlighter } from './assets/js/reader/WordHighlighter.js';

const highlighter = new WordHighlighter({
  vocabularyStorage: vocabStorage,
  enableAudio: true
});
```

#### Methods

##### `initialize(container: Element, wordPopover: WordPopover): void`
Initialize highlighter with container and popover.

##### `makeElementInteractive(element: Element): void`
Make text content interactive by adding word highlighting.

##### `destroy(): void`
Clean up event listeners and resources.

### PaginationController

Orchestrates different pagination strategies.

#### Constructor
```javascript
import { PaginationController } from './assets/js/reader/PaginationController.js';

const controller = new PaginationController({
  enableProgressSaving: true,
  enableKeyboardNav: true
});
```

#### Methods

##### `initialize(container: Element): void`
Initialize with container element.

##### `async setupPagination(contentElement: Element, bookId: string): Promise<void>`
Setup pagination for content.

##### `async switchMode(mode: string): Promise<void>`
Switch pagination mode ('css-columns', 'scroll', 'pages').

##### `getCurrentPageInfo(): Object`
Get current page information.

### CSSColumnsPaginator (Recommended)

Modern CSS-based pagination with optimal performance.

#### Constructor
```javascript
import { CSSColumnsPaginator } from './assets/js/reader/CSSColumnsPaginator.js';

const paginator = new CSSColumnsPaginator({
  columnWidth: '90vw',
  columnGap: '40px'
});
```

#### Methods

##### `async setupPagination(contentElement: Element): Promise<void>`
Setup CSS columns pagination.

##### `async goToPage(pageIndex: number): Promise<boolean>`
Navigate to specific page.

##### `getCurrentPageInfo(): Object`
Get current pagination state.

##### `saveProgress(): Promise<void>`
Save reading progress.

### ProgressManager

Unified progress tracking across all pagination modes.

#### Constructor
```javascript
import { ProgressManager } from './assets/js/reader/ProgressManager.js';

const progress = new ProgressManager({
  autoSave: true,
  saveDelay: 1000
});
```

#### Methods

##### `setBookId(bookId: string): void`
Set book for progress tracking.

##### `updateProgress(data: Object): void`
Update progress data.

##### `loadProgress(): Object|null`
Load saved progress.

##### `getProgressPercentage(): number`
Get progress as percentage (0-1).

### NavigationController

Handles navigation UI and controls.

#### Constructor
```javascript
import { NavigationController } from './assets/js/reader/NavigationController.js';

const nav = new NavigationController({
  showPageIndicator: true,
  enableKeyboardNav: true,
  enableSwipeNav: true
});
```

#### Methods

##### `initialize(container: Element, paginator: Paginator): void`
Initialize with container and paginator.

##### `updateNavigationState(): void`
Update navigation buttons state.

### SearchController

Provides in-book text search functionality.

#### Constructor
```javascript
import { SearchController } from './assets/js/reader/SearchController.js';

const search = new SearchController({
  enableKeyboardShortcut: true,
  maxResults: 100
});
```

#### Methods

##### `initialize(container: Element): void`
Initialize search with container.

##### `showSearchDialog(): void`
Show search dialog.

##### `performSearch(query: string): Promise<void>`
Perform text search.

## 📚 Legacy Services (Pre-v3.0)

## 📚 Core Services

### BookService

Central service for book management, parsing, and caching.

#### Constructor
```javascript
import { bookService } from './assets/js/services/book-service.js';

// Singleton instance - no constructor needed
// Automatically initializes IndexedDB and caches
```

#### Methods

##### `async getAllBooks(options?: Object): Promise<Book[]>`
Get all books from library.

**Parameters:**
- `options.forceRefresh?: boolean` - Skip cache and reload from storage

**Returns:** Array of Book objects

**Example:**
```javascript
const books = await bookService.getAllBooks();
const freshBooks = await bookService.getAllBooks({ forceRefresh: true });
```

##### `async getBook(bookId: string): Promise<Book|null>`
Get specific book by ID.

**Parameters:**
- `bookId: string` - Unique book identifier

**Returns:** Book object or null if not found

##### `async addBook(book: Book): Promise<Book>`
Add new book to library.

**Parameters:**
- `book: Book` - Book object to add

**Returns:** Added book object

**Throws:** Error if book already exists or invalid data

##### `async removeBook(bookId: string): Promise<boolean>`
Remove book from library.

**Parameters:**
- `bookId: string` - Book ID to remove

**Returns:** true if successfully removed

##### `async loadBookContent(bookId: string): Promise<BookContent>`
Load parsed book content.

**Parameters:**
- `bookId: string` - Book ID to load

**Returns:** BookContent object with HTML and metadata

**Throws:** Error if book not found or parsing fails

##### `async parseContent(data: Blob, format: string): Promise<BookContent>`
Parse book data into readable content.

**Parameters:**
- `data: Blob` - Book file data
- `format: string` - File format ('fb2', 'epub', 'txt')

**Returns:** Parsed BookContent

## 🎨 UI Components

### ToastManager

Global notification system with queue management.

#### Constructor
```javascript
import { toastManager } from './assets/js/ui/managers/ToastManager.js';
// Singleton - auto-initializes
```

#### Methods

##### `show(options: ToastOptions): string`
Show toast notification.

**Parameters:**
```typescript
interface ToastOptions {
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number; // 0 = no auto-dismiss
  actions?: ActionButton[];
  onClose?: Function;
}

interface ActionButton {
  label: string;
  variant?: 'primary' | 'secondary';
  onClick: Function;
  dismissOnClick?: boolean;
}
```

**Returns:** Toast ID string

##### Convenience Methods

```javascript
// Success notification
toastManager.success(message: string, options?: Partial<ToastOptions>)

// Error notification
toastManager.error(message: string, options?: Partial<ToastOptions>)

// Warning notification
toastManager.warning(message: string, options?: Partial<ToastOptions>)

// Info notification
toastManager.info(message: string, options?: Partial<ToastOptions>)

// Dismiss specific toast
toastManager.dismiss(toastId: string)

// Dismiss all toasts
toastManager.dismissAll()
```

**Examples:**
```javascript
// Basic success
toastManager.success('Book uploaded successfully!');

// Error with retry action
toastManager.error('Upload failed', {
  title: 'Network Error',
  actions: [{
    label: 'Retry',
    variant: 'primary',
    onClick: () => retryUpload()
  }]
});

// Progress notification (no auto-dismiss)
const toastId = toastManager.info('Processing book...', {
  duration: 0
});

// Later dismiss it
toastManager.dismiss(toastId);
```

### DropZone

Drag and drop file upload component.

#### Constructor
```javascript
import { DropZone } from './assets/js/ui/components/DropZone.js';

const dropzone = new DropZone(containerElement, options);
```

#### Options
```typescript
interface DropZoneOptions {
  accept?: string[];        // ['.fb2', '.epub', '.txt']
  maxSize?: number;         // Max file size in bytes
  multiple?: boolean;       // Allow multiple files
  onUpload?: Function;      // (file, index, total) => Promise
  onError?: Function;       // (errors: string[]) => void
}
```

#### Methods

##### `destroy(): void`
Clean up event listeners and remove from DOM.

**Example:**
```javascript
const dropzone = new DropZone(container, {
  accept: ['.fb2', '.epub', '.txt'],
  maxSize: 50 * 1024 * 1024, // 50MB
  multiple: true,
  onUpload: async (file, index, total) => {
    console.log(`Processing ${file.name} (${index + 1}/${total})`);

    const book = await processFile(file);
    return book;
  },
  onError: (errors) => {
    console.error('Upload errors:', errors);
    // errors is array of error messages
  }
});

// Later cleanup
dropzone.destroy();
```

### Skeleton

Loading state placeholder component.

#### Static Methods

##### `Skeleton.bookCard(): string`
Generate HTML for single book card skeleton.

**Returns:** HTML string

##### `Skeleton.bookGrid(count: number): string`
Generate HTML for grid of skeleton book cards.

**Parameters:**
- `count: number` - Number of skeleton cards

**Returns:** HTML string

**Example:**
```javascript
import { Skeleton } from './assets/js/ui/components/Skeleton.js';

// Show loading state
container.innerHTML = Skeleton.bookGrid(6);

// Later replace with real content
const books = await loadBooks();
container.innerHTML = renderBookGrid(books);
```

### ModalManager

Modal dialog management system.

#### Constructor
```javascript
import { modalManager } from './assets/js/ui/managers/ModalManager.js';
// Singleton - auto-initializes
```

#### Methods

##### `show(options: ModalOptions): void`
Show modal dialog.

**Parameters:**
```typescript
interface ModalOptions {
  title: string;
  content: string | HTMLElement;
  onClose?: Function;
  actions?: ActionButton[];
}
```

##### `close(): void`
Close current modal.

**Example:**
```javascript
modalManager.show({
  title: 'Confirm Delete',
  content: 'Are you sure you want to delete this book?',
  actions: [
    {
      label: 'Delete',
      variant: 'danger',
      onClick: () => deleteBook()
    },
    {
      label: 'Cancel',
      variant: 'secondary',
      onClick: () => modalManager.close()
    }
  ]
});
```

## 📖 Parsers

### FB2Parser

FictionBook 2.0 format parser with encoding detection.

#### Constructor
```javascript
import { FB2Parser } from './assets/js/parsers/fb2-parser.js';

const parser = new FB2Parser();
```

#### Methods

##### `async parse(file: Blob|File): Promise<BookContent>`
Parse FB2 file into book content.

**Parameters:**
- `file: Blob|File` - FB2 file to parse

**Returns:** Parsed book content

**Throws:** Error for invalid XML or unsupported encoding

**Features:**
- Automatic encoding detection (windows-1251, koi8-r, utf-8)
- Metadata extraction (title, author, description)
- Body filtering (skips notes sections)
- Formatting preservation (emphasis, strong, etc.)
- Image extraction from binary sections

### EPUBParser

EPUB 2.0/3.0 format parser using JSZip.

#### Constructor
```javascript
import { EPUBParser } from './assets/js/parsers/epub-parser.js';

const parser = new EPUBParser();
```

#### Methods

##### `async parse(file: Blob|File): Promise<BookContent>`
Parse EPUB file into book content.

**Parameters:**
- `file: Blob|File` - EPUB file to parse

**Returns:** Parsed book content

**Throws:** Error for invalid ZIP or missing OPF

**Features:**
- Dynamic JSZip loading (CDN)
- Container.xml parsing
- OPF metadata extraction
- Spine processing (reading order)
- XHTML chapter parsing

## 🏗️ Core Classes

### Application

Main application bootstrap and lifecycle management.

#### Constructor
```javascript
import { Application } from './assets/js/core/Application.js';

const app = new Application({
  root: HTMLElement,           // App container
  loading: HTMLElement,        // Loading screen
  errorBoundary: HTMLElement,   // Error display
  logLevel: 'info'|'warn'|'error'
});
```

#### Methods

##### `async bootstrap(): Promise<void>`
Initialize application with all managers and routing.

**Throws:** Error if bootstrap fails

##### `handleGlobalError(error: Error): void`
Handle uncaught errors globally.

### Router

Hash-based SPA router.

#### Constructor
```javascript
import { Router } from './assets/js/core/router.js';

const router = new Router({
  'library': LibraryView,
  'reader': ReaderView,
  // ... more routes
});
```

#### Methods

##### `navigate(route: string, params?: any[]): Promise<void>`
Navigate to route with optional parameters.

##### `destroy(): void`
Clean up router and view instances.

## 📊 Data Types

### Book
```typescript
interface Book {
  id: string;
  title: string;
  author?: string;
  description?: string;
  cover?: string;
  file: string | Blob;
  format: 'fb2' | 'epub' | 'txt';
  isServerBook?: boolean;
  source: 'server' | 'upload' | 'import';
  wordCount?: number;
  level?: string;
  tags?: string[];
  uploadedAt: number;
  size: number;
}
```

### BookContent
```typescript
interface BookContent {
  html: string;
  sections: BookSection[];
  metadata: BookMetadata;
  images?: Map<string, string>; // Binary images (Base64)
  wordCount?: number;
}

interface BookSection {
  id: string;
  title: string;
  wordCount: number;
}

interface BookMetadata {
  title: string;
  author: string;
  language?: string;
  description?: string;
  cover?: string | { type: 'reference', id: string };
}
```

## 🎯 Error Types

### Parsing Errors
```javascript
// FB2 parsing errors
throw new Error('Invalid XML structure');
throw new Error('No body element found');

// EPUB parsing errors
throw new Error('Invalid container.xml: no rootfile');
throw new Error('OPF file not found at path');

// File validation errors
throw new Error('Unsupported file format');
throw new Error('File too large');
```

### Network Errors
```javascript
throw new Error('Book not found');
throw new Error('Network request failed');
```

## 🔧 Utilities

### Logger

Centralized logging utility.

```javascript
import { logger } from './assets/js/utils/logger.js';

const childLogger = logger.createChild('ComponentName');

// Log levels
childLogger.debug('Debug message', data);
childLogger.info('Info message');
childLogger.warn('Warning message', error);
childLogger.error('Error message', error);
```

### Performance Monitor

Performance tracking utility.

```javascript
import { performanceMonitor } from './assets/js/utils/performance-monitor.js';

// Start timing
const markId = performanceMonitor.mark('operation-start');

// End timing
const duration = performanceMonitor.measure(markId);
console.log(`Operation took ${duration.toFixed(2)}ms`);
```

## 🎨 CSS Custom Properties

### Color Variables
```css
:root {
  --primary-color: #007AFF;
  --accent-color: #34C759;
  --danger-color: #FF3B30;
  --warning-color: #FFCC00;

  --bg-primary: #ffffff;
  --bg-secondary: #f2f2f7;
  --card-bg: #ffffff;
  --border-color: #e5e5ea;

  --text-primary: #000000;
  --text-secondary: #8e8e93;
}
```

### Spacing Variables
```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
}
```

### Typography Variables
```css
:root {
  --fs-h1: 32px;
  --fs-h3: 20px;
  --fs-body: 16px;
  --fs-caption: 14px;
}
```

### Animation Variables
```css
:root {
  --ms-duration-fast: 200ms;
  --ms-duration-normal: 300ms;
  --ms-curve-default: ease-out;
  --ms-curve-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
```

## 🔄 Event System

### Global State Management

```javascript
import { globalState } from './assets/js/core/state-manager.js';

// Update state
await globalState.setState(state => ({
  ...state,
  library: {
    ...state.library,
    books: newBooks
  }
}), 'BOOKS_UPDATED');

// Subscribe to changes
const unsubscribe = globalState.subscribe((state, action) => {
  console.log('State changed:', action);
  updateUI(state);
});
```

## 📱 Browser APIs

### Service Worker

```javascript
// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js')
    .then(registration => {
      console.log('SW registered:', registration.scope);
    });
}
```

### IndexedDB

```javascript
// Open database
const db = await bookService.openDB();

// Store data
await bookService.saveToDB('books', bookData);

// Retrieve data
const books = await bookService.getFromDB('books');
```

### Web Workers

```javascript
// Create worker for large file parsing
const worker = new Worker('./assets/js/workers/book-parser.worker.js');

// Send work to worker
worker.postMessage({
  file: bookFile,
  format: 'fb2'
});

// Receive results
worker.onmessage = (event) => {
  const { success, result, error } = event.data;
  if (success) {
    handleParsedContent(result);
  } else {
    handleError(error);
  }
  worker.terminate();
};
```

This API reference covers all major components and usage patterns. For implementation details, see the source code and unit tests.
