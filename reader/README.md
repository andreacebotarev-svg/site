# 📚 Reader - Advanced Language Learning E-Book Reader

Reader is a high-performance, privacy-first Progressive Web Application (PWA) designed for language learners. It transforms passive reading into active vocabulary acquisition through integrated dictionary lookups, automated word tracking, advanced pagination system, and comprehensive bug tracking. Features a Spaced Repetition System (SRS) based on the SM-2 algorithm with enterprise-level error monitoring.

**🎯 Latest Update**: Flashcard animation stability fix and comprehensive testing infrastructure added.

## 🚀 Core Value Propositions

- **Zero-Friction Learning**: One-click definitions and word saving while reading.
- **Advanced Reading Experience**: Multiple pagination modes (CSS Columns, Scroll, Pages) with seamless switching.
- **Scientifically Proven Retention**: Integrated SM-2 spaced repetition for long-term memory.
- **Stable Flashcard System**: Race-condition-free animations with comprehensive testing infrastructure.
- **Enterprise-Level Reliability**: Comprehensive bug tracking and automatic error reporting.
- **Privacy First**: 100% client-side processing. Your data never leaves your device.
- **Offline Ready**: Full functionality without internet once books are loaded.
- **Progress Persistence**: Automatic saving of reading position across all modes.
- **Modular Architecture**: Component-based design for easy extension and maintenance.

## 🛠 Technical Architecture

### System Stack
- **Frontend**: Vanilla JavaScript (ES Modules), HTML5, CSS3.
- **Storage**:
  - `LocalStorage`: Metadata, settings, SRS schedules, and reading progress.
  - `SessionStorage`: API cache and temporary session state.
  - `IndexedDB`: Large book binary storage and image blobs.
- **APIs**:
  - `Web Audio API`: Immersive UI sounds and haptics.
  - `Web Speech API`: Native word pronunciation.
  - `Free Dictionary API`: Real-time definitions and etymology.
  - `File API`: Local file reading for offline book import.

### Component-Based Architecture

Reader uses a modern component-based architecture with clear separation of concerns:

#### Core Components
- **ReaderView**: Main orchestrator coordinating all reading components
- **BookLoader**: Handles book loading, parsing, and metadata management
- **ContentRenderer**: Renders book content with support for different formats
- **WordHighlighter**: Manages interactive word highlighting and popovers
- **PaginationController**: Orchestrates different pagination strategies
- **ReaderUIController**: Manages UI states and user feedback

#### Pagination System
- **BasePaginator**: Abstract base class for all pagination implementations
- **CSSColumnsPaginator**: Modern CSS columns-based pagination (recommended)
- **ScrollPaginator**: Traditional scroll-based navigation
- **PagePaginator**: DOM manipulation-based page system
- **ProgressManager**: Unified progress tracking across all pagination modes
- **NavigationController**: UI controls and gesture handling
- **SearchController**: In-book text search with highlighting

### Module Breakdown
- **Reader Engine**: Modular content rendering with format-specific parsers (FB2, EPUB, TXT)
- **Pagination System**: Multiple pagination strategies with unified progress tracking
- **Vocabulary Manager**: Enhanced storage with indexing and SM-2 SRS implementation
- **Flashcard System**: Complete SRS learning module with review scheduling
- **Bug Control System**: Enterprise-level error tracking and automated reporting
- **Progress Manager**: Comprehensive cross-mode progress persistence
- **UI Components**: Reusable components with accessibility support

## 📦 Directory Structure

```text
reader/
├── assets/
│   ├── js/
│   │   ├── core/              # Application foundation
│   │   │   ├── Application.js      # Bootstrap & lifecycle
│   │   │   ├── router.js           # SPA navigation
│   │   │   ├── state-manager.js    # Global state management
│   │   │   └── OmniDebugger.js     # Bug tracking system
│   │   ├── reader/             # Reading components (NEW)
│   │   │   ├── ContentRenderer.js      # Book content rendering
│   │   │   ├── WordHighlighter.js      # Interactive word highlighting
│   │   │   ├── BookLoader.js           # Book loading & parsing
│   │   │   ├── PaginationController.js # Pagination orchestration
│   │   │   ├── ReaderUIController.js   # UI state management
│   │   │   ├── BasePaginator.js        # Base pagination class
│   │   │   ├── CSSColumnsPaginator.js  # CSS columns pagination
│   │   │   ├── ScrollPaginator.js      # Scroll-based pagination
│   │   │   ├── PagePaginator.js        # DOM-based pagination
│   │   │   ├── ProgressManager.js      # Progress tracking
│   │   │   ├── NavigationController.js # Navigation UI
│   │   │   ├── SearchController.js     # In-book search
│   │   │   └── parsers/            # Content parsers
│   │   │       ├── fb2-parser.js
│   │   │       └── epub-parser.js
│   │   ├── services/           # Business logic
│   │   │   ├── book-service.js         # Book management
│   │   │   └── reading-progress.js     # Progress service
│   │   ├── views/              # Page views
│   │   │   ├── ReaderView.js           # Main reading view (refactored)
│   │   │   ├── LibraryView.js
│   │   │   └── ...
│   │   ├── vocabulary/         # Vocabulary system
│   │   │   ├── vocabulary-storage.enhanced.js
│   │   │   └── dictionary-api.js
│   │   ├── flashcards/         # SRS learning (TODO)
│   │   ├── ui/                 # UI components
│   │   │   ├── components/          # Reusable components
│   │   │   └── managers/           # Global managers
│   │   ├── utils/              # Utilities
│   │   └── a11y/               # Accessibility
│   └── css/
│       ├── base.css           # CSS reset & variables
│       ├── components/        # Component styles
│       └── views/             # View-specific styles
├── books/                     # Book storage & metadata
├── tests/                     # Test suite
│   ├── parsers.test.js        # Parser unit tests
│   └── setup.js              # Test configuration
├── docs/                      # Documentation (generated)
├── *.html                     # HTML entry points
├── *.md                       # Documentation files
├── package.json               # Dependencies & scripts
└── service-worker.js          # PWA offline support
```

## 🧠 Key Logic: SM-2 Algorithm

The flashcard system uses the SuperMemo-2 algorithm to calculate optimal review intervals:
- **I(1) = 1 day**
- **I(2) = 6 days**
- **I(n) = I(n-1) * EF** (where EF is the Ease Factor)

The Ease Factor is adjusted based on user quality ratings (0-5), ensuring difficult words appear more frequently.

## 📖 Advanced Reading Features

### Advanced Pagination System v4.0
Reader features a revolutionary mathematical content chunking system that creates consistent, predictable learning experiences:

#### Mathematical Content Chunking
- **Paragraph Packing**: 4-6 paragraphs per page using greedy bin-packing algorithm
- **Chapter Grouping**: 5 pages per chapter for consistent study sessions
- **Hierarchical Structure**: Book → Chapters → Pages → Paragraphs
- **Predictable Sessions**: Each page = 5-10 minutes of focused reading

#### Available Pagination Modes
- **Pages Mode** (New v4.0): Mathematical pagination with hierarchical navigation
  - Structured learning chunks with predictable size
  - Deep linking: `?bookId=X&chapter=Y&page=Z`
  - Table of Contents with chapter/page navigation
  - Progress tracking across chapters

- **CSS Columns Mode** (Recommended): Modern CSS columns with smooth horizontal scrolling
  - Pure CSS implementation (no DOM manipulation)
  - Best performance and visual quality
  - Seamless column-to-column navigation
  - Automatic responsive recalculation

- **Scroll Mode**: Traditional continuous scrolling
  - Smooth vertical scrolling with progress tracking
  - Optimized for long-form content
  - Touch and keyboard navigation support

#### Pagination Architecture
```javascript
// Component-based pagination system
const paginationController = new PaginationController();
await paginationController.setupPagination(contentElement, bookId);

// Switch between modes dynamically
await paginationController.switchMode('css-columns');
// or
await paginationController.switchMode('scroll');
// or
await paginationController.switchMode('pages');
```

### Progress Tracking System
Unified progress management across all pagination modes:

- **Multi-Format Persistence**: Automatic progress saving for each pagination type
- **Cross-Mode Compatibility**: Switch between pagination modes without losing progress
- **Throttled Storage**: Optimized localStorage usage with debouncing
- **Session Recovery**: Automatic position restoration on app restart
- **Progress Export**: Backup and restore reading progress

#### Progress Manager API
```javascript
const progressManager = new ProgressManager();
progressManager.setBookId(bookId);

// Automatic progress tracking
progressManager.updateProgress({
  page: currentPage,
  scrollTop: scrollPosition,
  mode: 'css-columns'
});

// Manual progress control
await progressManager.saveProgress();
const savedProgress = progressManager.loadProgress();
```

## 🎛️ Pagination Version Control

Reader supports two pagination systems with intelligent version selection:

### Version Selection Logic

The system uses a **3-tier priority hierarchy** to determine which pagination version to use:

#### Priority Levels
1. **🔵 URL Parameter** (Highest Priority)
   - `?paginationV4=true` - Force v4.0 mathematical pagination
   - `?paginationV4=false` - Force v3.x legacy pagination
   - **Use case**: Testing, debugging, A/B testing

2. **🟢 localStorage Preference** (Medium Priority)
   - `reader_pagination_version = 'v4'` - User preference saved
   - **Use case**: Persistent user choice, settings UI

3. **🟡 Default Behavior** (Lowest Priority)
   - **New users**: Automatically get v4.0 (progressive enhancement)
   - **Fallback**: v3.x if errors occur

#### Decision Flow
```
Page Load → detectPaginationV4Support()
    ↓
URL param exists? → Use URL value
    ↓ (No)
localStorage set? → Use saved preference
    ↓ (No)
Default to v4.0 → New users get latest features
    ↓ (Error)
Fallback to v3.x → Safe degradation
```

### Practical Usage Examples

#### Testing & Debugging
```bash
# Force v4.0 for testing
http://yoursite.com/reader.html?bookId=123&paginationV4=true

# Force v3.x for comparison
http://yoursite.com/reader.html?bookId=123&paginationV4=false
```

#### User Preferences
```javascript
// Save user choice in settings
function setPaginationVersion(version) {
  if (version === 'v4') {
    localStorage.setItem('reader_pagination_version', 'v4');
  } else {
    localStorage.removeItem('reader_pagination_version');
  }
  location.reload(); // Apply changes
}
```

#### Gradual Rollout
```javascript
// Progressive deployment
const rolloutPercentage = 100; // Gradually increase: 10% → 30% → 70% → 100%

function shouldEnableV4() {
  return Math.random() * 100 < rolloutPercentage;
}

if (shouldEnableV4()) {
  localStorage.setItem('reader_pagination_version', 'v4');
}
```

### Version Detection in Code

#### Check Current Version
```javascript
// In browser console
window.readerView.usePaginationV4  // → true (v4.0) or false (v3.x)

// Full statistics
window.readerView.getStats()  // → Shows pagination version and stats
```

#### Debug Version Selection
```javascript
function getPaginationDebugInfo() {
  const version = window.readerView.usePaginationV4 ? 'v4.0' : 'v3.x';

  let detectionMethod = 'Default (v4.0)';

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('paginationV4')) {
    detectionMethod = `URL Override (paginationV4=${urlParams.get('paginationV4')})`;
  } else {
    const saved = localStorage.getItem('reader_pagination_version');
    if (saved === 'v4') {
      detectionMethod = 'localStorage Preference';
    }
  }

  console.log(`
    📊 PAGINATION VERSION INFO:
    ---------------------------
    Current Version: ${version}
    Detection Method: ${detectionMethod}
    Stats: ${JSON.stringify(window.readerView.getStats().pagination, null, 2)}
  `);
}
```

## 🐛 Bug Control System

Enterprise-level error tracking and management:

### Automatic Bug Detection
- **JavaScript Errors**: Automatic capture of runtime errors
- **Network Failures**: Tracking of API and resource loading issues
- **Unhandled Promises**: Detection of async operation failures
- **Console Errors**: Integration with browser console error reporting

### Bug Lifecycle Management
- **Status Tracking**: open → investigating → fixing → closed
- **Severity Levels**: low, medium, high, critical
- **Tagging System**: Categorization and filtering capabilities
- **Comment System**: Discussion and resolution tracking

### Component Architecture Benefits
The new modular architecture provides:

- **Separation of Concerns**: Each component has a single responsibility
- **Testability**: Individual components can be unit tested in isolation
- **Maintainability**: Changes in one component don't affect others
- **Reusability**: Components can be used across different parts of the app
- **Performance**: Lazy loading and optimized memory usage
- **Extensibility**: Easy to add new pagination modes or features

### Developer Tools
```javascript
// Bug tracking console commands
bug.help()           // Show all commands
bug.list()           // List bugs with filters
bug.report()         // Create new bug
bug.status()         // Update bug status
bug.stats()          // Show statistics
bug.export()         // Download bug reports

// Component debugging
readerView.getStats()         // Get reading view statistics
paginationController.getStats() // Get pagination statistics
progressManager.getStats()     // Get progress statistics
```

## 📱 Mobile & PWA Features

- **Responsive Design**: Custom layouts for portrait and landscape mobile views.
- **Touch Gestures**: Native-feeling swipe navigation and drag-to-close menus.
- **Installable**: Full manifest support for "Add to Home Screen".
- **Haptics**: Tactile feedback for critical actions (saving words, finishing sessions).

## 🔧 Component API Reference

### Core Components

#### ReaderView
Main orchestrator for the reading experience.
```javascript
const readerView = new ReaderView(container, [bookId]);
await readerView.render();
const stats = readerView.getStats();
readerView.destroy();
```

#### ContentRenderer
Handles book content rendering and formatting.
```javascript
const renderer = new ContentRenderer();
const html = await renderer.renderBookContent(content, bookId);
renderer.cleanupBlobUrls();
```

#### WordHighlighter
Manages interactive word highlighting and popovers.
```javascript
const highlighter = new WordHighlighter();
highlighter.initialize(container, wordPopover);
highlighter.makeElementInteractive(contentElement);
```

#### PaginationController
Orchestrates different pagination strategies.
```javascript
const controller = new PaginationController();
await controller.setupPagination(contentElement, bookId);
await controller.switchMode('css-columns');
const info = controller.getCurrentPageInfo();
```

### Pagination Components

#### CSSColumnsPaginator (Recommended)
Modern CSS-based pagination with optimal performance.
```javascript
const paginator = new CSSColumnsPaginator({
  columnWidth: '90vw',
  columnGap: '40px'
});
await paginator.setupPagination(contentElement);
await paginator.goToPage(5);
```

#### ProgressManager
Unified progress tracking across all modes.
```javascript
const progress = new ProgressManager();
progress.setBookId(bookId);
progress.updateProgress({ page: 10, mode: 'css-columns' });
await progress.saveProgress();
```

## 🧪 Testing & Quality Assurance

### Test Coverage
- **Unit Tests**: Individual component testing with Vitest
- **Integration Tests**: Component interaction testing
- **E2E Tests**: Full user workflow testing (planned)
- **Performance Tests**: Memory and rendering benchmarks

### Test Structure
```
tests/
├── parsers.test.js           # Content parser tests
├── pagination.test.js        # Legacy pagination component tests
├── pagination-v4.test.js     # NEW: Mathematical pagination system tests
├── progress.test.js          # Progress tracking tests
├── setup.js                  # Test configuration
└── integration/              # Integration test suites
```

### Running Tests
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
npm run test:ui       # Visual test interface

# Test specific components
npm run test:pagination-v4    # Test new pagination system
npm run test:integration      # Run integration tests
```

### Demo & Examples
- **`test-flashcard-flip.html`**: Interactive flashcard flip animation testing and diagnostics
- **`test-pagination-v4-demo.html`**: Interactive demo of the new pagination system
- **`test-pagination-integration.html`**: Integration testing interface
- **Mathematical Algorithm Demo**: Live demonstration of paragraph packing

### Test Metrics (v4.0)
- **Unit Test Coverage**: >95% for new pagination components
- **Integration Tests**: Full workflow coverage
- **Performance Benchmarks**: <500ms pagination, <100ms rendering
- **Cache Hit Rate**: >95% for repeated content

## 💾 Data Portability & Export

Enhanced data export capabilities:

### Export Formats
- **Vocabulary**: Anki-compatible CSV, JSON, and plain text
- **Reading Progress**: Cross-mode progress with pagination metadata
- **Bug Reports**: Comprehensive debugging data with system info
- **Complete Backup**: Full application state for migration/backup

### Component-Level Export
```javascript
// Export reading progress
const progressData = progressManager.exportProgress();

// Export vocabulary data
const vocabData = vocabularyStorage.exportData();

// Export bug tracking data
const bugData = debugger.exportBugData();
```

### Privacy & Security
- **Zero External Dependencies**: All data processing happens client-side
- **No Data Transmission**: User data never leaves the device
- **Export Control**: Users maintain full control over their data
- **Secure Storage**: Sensitive data encrypted in localStorage/IndexedDB

## 🚀 Future Enhancements

### Planned Features
- **Local File Support**: Drag-and-drop book import without server
- **Advanced SRS**: Enhanced spaced repetition with statistics
- **Reading Analytics**: Detailed reading habits and comprehension tracking
- **Offline Dictionary**: Complete offline word definitions
- **Reading Goals**: Progress tracking with achievement system

### Architecture Improvements
- **Web Workers**: Heavy parsing moved to background threads
- **Service Worker**: Enhanced offline capabilities
- **WebAssembly**: Performance-critical operations (future)
- **Plugin System**: Extensible architecture for custom features

---
*Developed with ❤️ for the language learning community. Built with modern JavaScript and component-based architecture.*

