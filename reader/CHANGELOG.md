# 📋 Changelog

All notable changes to the Reader application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.2.0] - Flashcard Animation Stability Fix - 2025-01-XX

### 🐛 Bug Fixes
- **Flashcard Word Disappearance**: Fixed critical race condition in flashcard flip animation
  - **Root Cause**: CSS transition race condition between `display: none` and smooth animations
  - **Solution**: Replaced `display: none` with `opacity/visibility` transitions
  - **Impact**: Eliminates word disappearing during card flip on all devices/browsers
- **CSS Architecture**: Resolved conflicts between flashcard CSS files
  - Removed duplicate CSS loading (`flashcards.css` + `flashcards.simple.css`)
  - Streamlined CSS to use only optimized simple version

### 🎨 UI/UX Improvements
- **Smooth Animations**: Flashcard flip now uses proper CSS transitions
- **Performance**: Reduced DOM manipulation during animations
- **Debugging**: Added comprehensive flip state logging and data validation

### 🛠️ Technical Improvements
- **Architecture**: Simplified flashcard flip logic (no DOM manipulation during transition)
- **Stability**: Eliminated race conditions in CSS transitions
- **Testing**: Added automated test file for flip functionality verification
- **Code Quality**: Improved error handling and data validation

### 📚 Documentation
- **Testing Guide**: Added flashcard flip test documentation
- **Architecture**: Updated flashcard implementation details
- **Troubleshooting**: Added debugging guide for animation issues

## [3.0.0] - Component Architecture Refactoring - 2025-01-XX

### 🎯 Major Refactoring
**Complete architectural overhaul** from monolithic components to modular component system.

#### Breaking Changes
- **ReaderView.js**: Reduced from 1100+ lines to 145 lines (87% reduction)
- **PaginationEngine.js**: Split from 1800+ lines into 7 focused components
- **Component-based architecture**: All major features now use composition pattern

#### Added - New Component System
- **ContentRenderer**: Dedicated book content rendering with format support
- **WordHighlighter**: Interactive word highlighting and popover management
- **BookLoader**: Centralized book loading and metadata management
- **PaginationController**: Orchestration of multiple pagination strategies
- **ReaderUIController**: UI state management and user feedback
- **CSSColumnsPaginator**: Modern CSS-based pagination (recommended)
- **ScrollPaginator**: Traditional scroll-based navigation
- **PagePaginator**: DOM manipulation-based page system
- **ProgressManager**: Unified progress tracking across all modes
- **NavigationController**: UI controls and gesture handling
- **SearchController**: In-book text search with highlighting
- **BasePaginator**: Abstract base class for all pagination implementations

#### Performance Improvements
- **87% code reduction** in main ReaderView component
- **Modular loading**: Components loaded on-demand
- **Memory optimization**: Proper cleanup and resource management
- **Efficient rendering**: Minimal DOM manipulation

#### Architecture Benefits
- **Separation of Concerns**: Each component has single responsibility
- **Testability**: Components can be unit tested in isolation
- **Maintainability**: Changes in one component don't affect others
- **Extensibility**: Easy to add new pagination modes or features
- **Reusability**: Components can be used across different parts of the app

#### Migration Notes
- All existing functionality preserved
- API compatibility maintained for external integrations
- Internal component APIs may have changed (not externally exposed)

### Technical Improvements
- **Component Composition**: Clean interfaces between components
- **Dependency Injection**: Components receive dependencies explicitly
- **Error Boundaries**: Better error isolation and recovery
- **Performance Monitoring**: Enhanced metrics collection
- **Code Coverage**: Improved testability of individual components

---

## [2.1.0] - Pagination & Bug Control - 2025-01-04

### Added
- Initial release of Reader application
- Support for FB2, EPUB, and TXT book formats
- Drag & drop file upload interface
- Offline book storage with IndexedDB
- Service worker for PWA functionality
- Responsive design for mobile and desktop
- Dark/light theme support
- Toast notification system
- Modal dialog management
- Skeleton loading states
- Component-based architecture
- Web Worker support for large file parsing
- Comprehensive error handling and logging
- Accessibility features (WCAG 2.1 AA compliance)
- Performance monitoring and analytics

### Changed
- Migrated from inline styles to modular CSS architecture
- Refactored LibraryView to use new components
- Updated application bootstrap to use centralized Application class
- Improved file parsing with encoding detection
- Enhanced caching strategy with multi-layer approach

### Technical Improvements
- **Architecture**: Complete rewrite to component-based architecture
- **Performance**: Added Web Workers for heavy computations
- **Caching**: Multi-layer caching (Memory → IndexedDB → Network)
- **Security**: Content Security Policy and input validation
- **Testing**: Comprehensive unit test coverage
- **Documentation**: Complete API reference and usage examples

## [2.1.0] - Pagination & Bug Control - 2025-01-04

### Added
- **📖 Pagination System**: Complete page-based reading mode
  - `PaginationEngine` for safe DOM manipulation and page splitting
  - Adaptive page height calculation based on viewport
  - Batched measurements to prevent layout thrashing
  - ResizeObserver for responsive page recalculation
  - Progress persistence across sessions

- **🐛 Bug Control System**: Advanced error tracking and management
  - Automatic bug registration from JavaScript errors and network failures
  - Manual bug reporting with severity levels (low/medium/high/critical)
  - Bug lifecycle management (open → investigating → fixing → closed)
  - Bug tagging and commenting system
  - Bug statistics and filtering capabilities
  - localStorage persistence for bug history
  - Console commands for bug management (`bug.help()`, `bug.report()`, etc.)

- **🎯 Reading Mode Switcher**: UI toggle between scroll and pages modes
  - Seamless mode switching with progress preservation
  - Visual indicators for active reading mode
  - Automatic progress restoration on mode change

- **💾 Enhanced Progress Tracking**:
  - Extended `BookService` with progress methods
  - Support for both scroll position and page index tracking
  - Throttled saving to prevent performance issues
  - Auto-save on visibility changes and page unload

### Changed
- **ReaderView**: Added reading mode management and pagination integration
- **BookService**: Extended with progress tracking methods and bug reporting
- **OmniDebugger**: Complete rewrite with comprehensive bug control system
- **Performance**: Optimized DOM manipulation with batched operations

### Fixed
- **Memory Management**: Improved cleanup of pagination DOM nodes
- **Error Handling**: Enhanced error reporting with automatic bug creation
- **Performance**: Reduced layout thrashing in pagination calculations

### Technical Improvements
- **Architecture**: Safe DOM manipulation patterns for pagination
- **Performance**: FastDOM-inspired batched read/write operations
- **Reliability**: Comprehensive error tracking and automatic reporting
- **UX**: Smooth transitions between reading modes
- **Persistence**: Robust progress saving with multiple fallback strategies

### Testing
- **Pagination Tests**: Complete test suite for pagination functionality
- **Bug Control Tests**: Full UI for testing bug reporting and management
- **Integration Tests**: End-to-end testing of reading modes and progress

### Developer Experience
- **Bug Commands**: Rich console API for bug management
- **Debug Tools**: Enhanced OmniDebugger with bug analytics
- **Documentation**: Complete guides for pagination and bug control systems

## [2.0.0] - Senior Level Architecture - 2025-12-29

### Added
- **Component System**: New modular UI component architecture
  - `ToastManager` for global notifications
  - `DropZone` for drag & drop file uploads
  - `Skeleton` for loading states
  - `ModalManager` for dialog management

- **Enhanced Parsers**:
  - FB2 parser with encoding detection (windows-1251, koi8-r, utf-8)
  - EPUB parser with dynamic JSZip loading
  - Improved metadata extraction and formatting preservation

- **Core Infrastructure**:
  - `Application.js` for centralized bootstrap
  - Enhanced router with transition animations
  - Global state management
  - Performance monitoring utilities

- **CSS Architecture**:
  - Modular CSS with base, layout, and component styles
  - CSS custom properties for theming
  - Responsive design utilities

- **Developer Experience**:
  - Comprehensive API documentation
  - Unit tests with Vitest
  - ESLint configuration
  - Development server setup

### Changed
- **LibraryView**: Refactored to use new components, removed inline styles
- **BookService**: Updated to use dedicated parsers
- **index.html**: New app shell with proper CSS loading strategy
- **Service Worker**: Enhanced caching strategy

### Removed
- Inline styles from components
- Legacy file upload implementation
- Basic toast implementations

### Fixed
- Memory leaks in component cleanup
- File encoding issues in FB2 parsing
- Mobile viewport handling
- Accessibility issues with keyboard navigation

### Security
- Added Content Security Policy
- Input validation for file uploads
- XSS prevention in HTML rendering

## [1.0.0] - Initial Release - 2025-12-01

### Added
- Basic book reading functionality
- Support for FB2 and TXT formats
- Simple file upload
- Basic library management
- Offline storage with localStorage
- Responsive layout

### Known Issues
- Limited format support
- Inline styles throughout
- No error handling
- Poor accessibility
- No testing infrastructure

---

## Development Roadmap

### Planned for v2.2.0
- [ ] Book search and filtering in library
- [ ] Reading statistics and analytics dashboard
- [ ] Export functionality for reading progress
- [ ] Enhanced accessibility features
- [ ] Touch gestures for pagination navigation
- [ ] Performance optimizations for large books

### Planned for v3.0.0
- [ ] AI-powered recommendations system
- [ ] Collaborative reading features
- [ ] Plugin architecture for custom parsers
- [ ] Advanced annotation and note-taking
- [ ] Multi-language interface support
- [ ] Cloud sync with optional backend
- [ ] Advanced SRS integration with reading progress

---

## Migration Guide

### From v1.x to v2.0

#### Component Usage Changes
```javascript
// Old way (v1.x)
const toast = document.createElement('div');
toast.style.cssText = '...';
document.body.appendChild(toast);

// New way (v2.0)
import { toastManager } from './assets/js/ui/managers/ToastManager.js';
toastManager.success('Message');
```

#### File Upload Changes
```javascript
// Old way (v1.x)
<input type="file" onchange="handleFile(this.files[0])">

// New way (v2.0)
import { DropZone } from './assets/js/ui/components/DropZone.js';
const dropzone = new DropZone(container, {
  onUpload: (file) => processFile(file)
});
```

#### Styling Changes
```javascript
// Old way (v1.x)
element.style.cssText = 'padding: 16px; background: white;';

// New way (v2.0)
element.className = 'card';
```

### Breaking Changes
- All inline styles removed
- Component APIs changed
- File parsing now async
- Toast system is global
- CSS uses custom properties

### From v2.0 to v2.1

#### Reading Mode Changes
```javascript
// New reading mode management in ReaderView
const readerView = new ReaderView(container, params);

// Switch between reading modes
await readerView.switchReadingMode('pages'); // or 'scroll'

// Access pagination engine
const pagination = readerView.paginationEngine;
pagination.showPage(5); // Jump to page 5
```

#### Bug Control System
```javascript
// OmniDebugger now includes comprehensive bug tracking
const debugger = new OmniDebugger({ enabled: true });

// Report bugs programmatically
debugger.reportBug("UI Issue", "Button not clickable", "medium");

// Use console commands
bug.help();      // Show available commands
bug.list();      // List all bugs
bug.stats();     // Show statistics
```

#### Progress Tracking Changes
```javascript
// BookService now includes progress methods
await bookService.saveReadingProgress(bookId, {
  mode: 'pages',
  pageIndex: 10,
  totalPages: 50
});

const progress = await bookService.getReadingProgress(bookId);
// Returns: { mode, pageIndex, scrollTop, timestamp }
```

#### Enhanced Error Handling
```javascript
// Errors now automatically create bugs
try {
  riskyOperation();
} catch (error) {
  // Bug is automatically created by OmniDebugger
  console.error('Operation failed:', error);
}
```

#### New Console Commands
```javascript
// Bug management commands
bug.report(title, desc, severity)    // Report new bug
bug.list({status, severity, tags})  // Filter bugs
bug.status(id, status, comment)     // Update bug status
bug.get(id)                         // Get bug details
bug.stats()                         // Show statistics
bug.export()                        // Download bugs as JSON
```

### Performance Improvements
- **Pagination**: Batched DOM measurements prevent layout thrashing
- **Bug Tracking**: Throttled localStorage saves prevent blocking
- **Memory**: Improved cleanup of pagination DOM nodes

### New Features
- **Reading Modes**: Switch between scroll and pages seamlessly
- **Progress Persistence**: Reading position saved automatically
- **Bug Analytics**: Comprehensive error tracking and reporting
- **Responsive Pagination**: Adapts to screen size changes

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines and [API.md](API.md) for technical documentation.
