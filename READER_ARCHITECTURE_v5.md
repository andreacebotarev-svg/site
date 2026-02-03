# 📚 English Lessons Reader v5.0 - Architecture Documentation

**Clean Flow Architecture - Single Source of Truth for Interactive Reading**

*Последнее обновление: январь 2026 | Burn & Rebuild - Technical Debt Eliminated*

---

## 🎯 Project Overview

**English Lessons Reader** is an advanced web-based EPUB reader with interactive vocabulary learning, optimized for A1-B2 English learners. The v5.0 release introduces **Clean Flow Architecture** - a complete system rewrite eliminating technical debt from V3/V4 eras.

### Live Demo
- **URL**: [Reader Application](https://andreacebotarev-svg.github.io/englishlessons/reader/)
- **Test Book**: "Dragon.epub" (demonstrates full functionality)

### Key Features v5.0
- 📖 **Clean EPUB Processing**: Zero content loss, semantic HTML preservation
- 🎯 **Unified Word System**: Single source of truth for all word interactions
- ⚡ **Pre-render Processing**: Instant interactivity without FOUC
- 🎬 **Contextual Translation**: Sentence context in word definitions
- 🏗️ **Clean Flow Architecture**: Predictable data pipeline, zero circular dependencies

---

## 🏛️ Clean Flow Architecture (v5.0)

### Core Philosophy
**Single Source of Truth + Clean Data Flow + Pre-render Processing**

### Architecture Pattern
```
Data Flow: BookService → Pagination → Render → Interaction → Vocabulary
Event Flow: User Click → InteractionLayer → VocabularyStorage → UI Update
```

### Key Principles

#### 1. **Single Source of Truth**
- **InteractionLayer**: Единственное место, знающее что такое "слово"
- **VocabularyStorage**: Единственное место, знающее что такое "сохраненное слово"
- **No Duplication**: Убраны все параллельные реализации (WordHighlighter conflicts)

#### 2. **Clean Data Pipeline**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ BookService │───▶│ Pagination  │───▶│   Render    │───▶│ Interaction │
│  (Raw EPUB) │    │ Controller  │    │  (HTML)     │    │   (Words)   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────┐
                                               │ Vocabulary  │
                                               │  (Storage)  │
                                               └─────────────┘
```

#### 3. **Pre-render Processing**
```
PageRenderer.renderPage()
├── _buildHTML()           // Create HTML string
├── tempDiv.innerHTML = html
├── interactionLayer.process(tempDiv)  // ✨ Pre-render word wrapping
├── container.appendChild(tempDiv)     // Instant DOM insertion
└── No FOUC, instant interactivity
```

---

## 📦 Core Components

### 1. **InteractionLayer** (ЯДРО) - Single Source of Truth
**File**: `reader/assets/js/reader/InteractionLayer.js`

**Responsibilities:**
- Word detection and wrapping in `<span class="interactive-word">`
- Event delegation for all word clicks
- Contextual sentence extraction
- Vocabulary highlighting (green saved words)

**Architecture:**
```javascript
class InteractionLayer {
  constructor(options) {
    this.vocabularyStorage = options.vocabularyStorage;
    this.wordPopover = options.wordPopover;
    this.normalizer = (text) => text.toLowerCase().trim().replace(/[^\w\s'-]/g, '');
  }

  // Pre-render: wrap words before DOM insertion
  process(rootElement) {
    this._wrapWordsInTextNodes(rootElement);
    this._highlightSavedWords(rootElement);
  }

  // Runtime: delegate events on container
  attach(container) {
    container.addEventListener('click', this._handleClick.bind(this));
  }

  // Single click handler for all words
  _handleClick(event) {
    const wordEl = event.target.closest('.interactive-word');
    if (wordEl) {
      const word = wordEl.dataset.word;
      const sentence = wordEl.dataset.sentence;
      this.wordPopover.show(wordEl, wordEl.getBoundingClientRect(), word, sentence);
    }
  }
}
```

### 2. **PageRenderer** (ИСПОЛНИТЕЛЬ) - Simple HTML Generator
**File**: `reader/assets/js/reader/pagination/PageRenderer.js`

**Responsibilities:**
- Convert paragraph objects to HTML strings
- Pre-render word processing via InteractionLayer
- Instant DOM insertion (no animations/transitions)

**Architecture:**
```javascript
class PageRenderer {
  constructor(container, options) {
    this.container = container;
    this.interactionLayer = options.interactionLayer; // Dependency injection
  }

  async renderPage(page, chapter) {
    // 1. Build HTML
    const html = this._buildHTML(page, chapter);

    // 2. Create temp container
    const tempDiv = document.createElement('div');
    tempDiv.className = 'page-content';
    tempDiv.innerHTML = html;

    // 3. ✨ MAGIC: Pre-render word processing
    if (this.interactionLayer) {
      this.interactionLayer.process(tempDiv);
    }

    // 4. Instant DOM replacement
    this.container.innerHTML = '';
    this.container.appendChild(tempDiv);
  }
}
```

### 3. **PaginationController** (ДИРИЖЕР) - Clean Conductor
**File**: `reader/assets/js/reader/PaginationController.js`

**Responsibilities:**
- Load and initialize all components
- Coordinate data flow between layers
- Manage page navigation

**Architecture:**
```javascript
class PaginationController {
  async loadDependencies() {
    // Load all components
    const [PagerMod, NavMod, RenderMod, InteractMod] = await Promise.all([...]);

    // 1. Create InteractionLayer (Core)
    this.interactionLayer = new InteractMod.InteractionLayer({
      vocabularyStorage: this.options.vocabularyStorage,
      wordPopover: this.options.getWordPopover()
    });

    // 2. Create other components...
  }

  async setupPagination(contentElement, bookId) {
    await this.loadDependencies();

    // Attach event delegation
    this.interactionLayer.attach(contentElement);

    // Create renderer with dependencies
    this.pageRenderer = new this.PageRendererClass(contentElement, {
      interactionLayer: this.interactionLayer
    });
  }
}
```

### 4. **VocabularyStorage Enhanced** (ХРАНИЛИЩЕ) - Unified Normalization
**File**: `reader/assets/js/vocabulary/vocabulary-storage.enhanced.js`

**Responsibilities:**
- Word storage with indexing
- Consistent word normalization
- Index rebuild on load

**Architecture:**
```javascript
class EnhancedVocabularyStorage {
  constructor() {
    this._normalizeWord = (text) => text.toLowerCase().trim().replace(/[^\w\s'-]/g, '');
    this.words = [];
    this.index = { byWord: new Map() };
  }

  // Unified normalization used everywhere
  isWordSaved(word) {
    const normalized = this._normalizeWord(word);
    return this.index.byWord.has(normalized);
  }

  addWord(wordData) {
    const normalizedWord = this._normalizeWord(wordData.word);
    // ... add with normalized key
  }
}
```

---

## 🔄 Data Flow & Event Handling

### Clean Data Pipeline
```
1. User uploads EPUB
   ↓
2. BookService.parseContent()
   → Extract text, images, metadata
   ↓
3. PaginationController.paginate()
   → Split into chapters/pages
   ↓
4. PageRenderer.renderPage()
   → Build HTML + Pre-render word processing
   ↓
5. DOM ready with interactive words
   ↓
6. User clicks word
   ↓
7. InteractionLayer._handleClick()
   → Extract word + sentence context
   ↓
8. WordPopover.show()
   → Display translation with context
```

### Event Handling Architecture
```
Container (e.g., .reader-content)
├── Event: click
├── Delegation: closest('.interactive-word')
├── Handler: InteractionLayer._handleClick()
├── Data: dataset.word + dataset.sentence
└── Action: WordPopover.show()
```

### Pre-render Word Processing
```
PageRenderer.renderPage()
├── Build HTML string
├── Create temp <div>
├── tempDiv.innerHTML = html
├── interactionLayer.process(tempDiv)  ← ✨ Word wrapping happens here
│   ├── _wrapWordsInTextNodes()
│   └── _highlightSavedWords()
├── container.appendChild(tempDiv)
└── Result: Instant interactive content
```

---

## 🎨 CSS Architecture

### Class-Based Styling (No Magic)
```css
/* Interactive word states */
.interactive-word {
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.1s;
}

.interactive-word:hover {
  background-color: rgba(0, 122, 255, 0.1);
}

/* Saved word indicator (single source of truth) */
.interactive-word.word-saved {
  color: #2e7d32;
  font-weight: 600;
  border-bottom: 2px solid #2e7d32;
}
```

### CSS Rules:
- **`.interactive-word`**: Base styling for clickable words
- **`.interactive-word:hover`**: Hover effects
- **`.interactive-word.word-saved`**: Green highlighting for saved words
- **No `::highlight` rules**: Eliminated conflicts from V3/V4

---

## ⚙️ Technical Implementation Details

### Word Normalization (Critical)
```javascript
// Single normalizer used across entire app
const normalizer = (text) => text
  .toLowerCase()
  .trim()
  .replace(/[^\w\s'-]/g, ''); // Remove punctuation

// Usage examples:
InteractionLayer: span.dataset.word = normalizer(word)
VocabularyStorage: isWordSaved(normalizer(word))
```

### Sentence Context Extraction
```javascript
_extractSentence(text, wordIndex) {
  const words = text.split(/(\s+)/);
  let start = wordIndex, end = wordIndex;

  // Find sentence boundaries (. ! ?)
  while (start > 0 && !/[.!?]$/.test(words[start - 1])) start--;
  while (end < words.length - 1 && !/[.!?]$/.test(words[end])) end++;

  const sentence = words.slice(start, end + 1).join('').trim();
  return sentence.length > 10 ? sentence : null;
}
```

### Event Delegation Pattern
```javascript
// Single listener on container (not on each word)
attach(container) {
  container.addEventListener('click', (event) => {
    const wordEl = event.target.closest('.interactive-word');
    if (wordEl) {
      this._handleClick(event, wordEl);
    }
  });
}
```

### Index Consistency
```javascript
load() {
  this.words = data ? JSON.parse(data) : [];

  // Critical: Clear index before rebuild
  this.index = { byWord: new Map(), byTag: new Map(), byDueDate: new Map() };

  this._buildIndices(); // Rebuild from clean state
}
```

---

## 🐛 Troubleshooting Guide

### Issue: Words not wrapping in `.interactive-word`
**Symptoms:** Click doesn't work, no spans in DOM
**Check:**
```javascript
// In console after page load:
document.querySelectorAll('.page-content .interactive-word').length
// Should be > 0
```

**Fix:** Ensure `interactionLayer.process()` called in PageRenderer

### Issue: Green highlighting not working
**Symptoms:** Saved words not highlighted
**Check:**
```javascript
// Check vocabulary
vocabularyStorage.words.length
vocabularyStorage.isWordSaved('test')

// Check CSS
getComputedStyle(document.querySelector('.word-saved'))
```

**Fix:** Ensure proper class management in `_highlightSavedWords()`

### Issue: Missing sentence context
**Symptoms:** Popover shows no sentence
**Check:**
```javascript
document.querySelector('.interactive-word').dataset.sentence
```

**Fix:** Ensure `_extractSentence()` working in `process()`

### Issue: Multiple event listeners
**Symptoms:** Words trigger multiple times
**Fix:** Ensure `attach()` called only once, with cleanup

---

## 📊 Performance Characteristics

### Benchmarks (v5.0)
- **Word Processing**: < 50ms for 1000-word page
- **DOM Insertion**: Instant (pre-rendered)
- **Memory Usage**: < 10MB additional for large books
- **Event Handling**: Single delegation listener
- **Vocabulary Lookup**: O(1) Map-based indexing

### Optimizations
- **Pre-render Processing**: Words processed before DOM insertion
- **Event Delegation**: One listener vs thousands
- **Index-based Lookup**: Fast vocabulary checks
- **Memory Management**: Clean component lifecycle

---

## 🔧 Development & Testing

### Component Testing
```javascript
// Test InteractionLayer word processing
const layer = new InteractionLayer({ vocabularyStorage });
const testDiv = document.createElement('div');
testDiv.textContent = 'Hello world test';
layer.process(testDiv);
console.log(testDiv.querySelectorAll('.interactive-word').length); // Should be 3
```

### Integration Testing
```javascript
// Test full pipeline
const controller = new PaginationController(options);
await controller.setupPagination(container, bookId);
await controller.navigateToPage(0);

// Check results
console.log(document.querySelectorAll('.interactive-word').length);
console.log(document.querySelectorAll('.word-saved').length);
```

### Debug Commands
```javascript
// Inspect word processing
window.interactionLayer?.process(testElement);

// Check vocabulary state
window.vocabularyStorage?.words?.length;
window.vocabularyStorage?.isWordSaved('test');

// Monitor events
document.addEventListener('click', (e) => {
  if (e.target.closest('.interactive-word')) {
    console.log('Word clicked:', e.target.dataset.word);
  }
});
```

---

## 🚀 Migration Guide (V4 → V5)

### Breaking Changes
1. **WordHighlighter removed**: All logic moved to InteractionLayer
2. **PageRenderer simplified**: No animations, focus on rendering
3. **Event handling unified**: Single delegation point
4. **Normalization standardized**: Single algorithm everywhere

### Migration Steps
1. **Update imports**: Remove WordHighlighter references
2. **Update PageRenderer**: Remove animation calls
3. **Update PaginationController**: Use new InteractionLayer API
4. **Test thoroughly**: Word clicking, highlighting, context

### Rollback Plan
- Backup files available in `backup/` folder
- Git history preserves V4 implementation
- Gradual migration possible component-by-component

---

## 📈 Future Enhancements

### Planned Features
- [ ] **Visual Vocabulary**: Word images/thumbnails
- [ ] **Spaced Repetition**: SM-2 algorithm integration
- [ ] **Reading Analytics**: Time tracking, comprehension metrics
- [ ] **Offline Mode**: Service Worker caching
- [ ] **Multi-bookmark**: Save multiple positions per book

### Technical Improvements
- [ ] **Virtual Scrolling**: For 1000+ page books
- [ ] **Progressive Loading**: Load pages on demand
- [ ] **Advanced Search**: Full-text search with highlighting
- [ ] **Export/Import**: Vocabulary backup
- [ ] **PWA Support**: Installable reader

---

## 📄 API Reference

### InteractionLayer API
```typescript
interface InteractionLayer {
  process(rootElement: Element): void;
  attach(container: Element): void;
  // Internal methods for word processing and event handling
}
```

### PageRenderer API
```typescript
interface PageRenderer {
  renderPage(page: Page, chapter: Chapter): Promise<void>;
  // Internal HTML building and DOM insertion
}
```

### VocabularyStorage API
```typescript
interface VocabularyStorage {
  addWord(wordData: WordData): Promise<void>;
  isWordSaved(word: string): boolean;
  getAllWords(): Word[];
  // Additional methods for indexing and persistence
}
```

---

## 📝 Changelog Summary (v4.0 → v5.0)

### Major Architectural Changes
- ✅ **Burn & Rebuild**: Complete system rewrite
- ✅ **Single Source of Truth**: InteractionLayer unification
- ✅ **Clean Flow Pipeline**: Predictable data flow
- ✅ **Pre-render Processing**: Zero FOUC
- ✅ **Unified Normalization**: Consistent word handling
- ✅ **Contextual Translation**: Sentence-aware definitions

### Technical Debt Eliminated
- ❌ Removed V3/V4 legacy code conflicts
- ❌ Fixed circular dependencies
- ❌ Eliminated duplicate event handlers
- ❌ Standardized word processing logic
- ❌ Cleaned up CSS conflicts

### Performance Improvements
- ⚡ **Instant Interactivity**: Pre-render word processing
- ⚡ **Efficient Events**: Single delegation listener
- ⚡ **Fast Lookups**: Index-based vocabulary checks
- ⚡ **Memory Optimized**: Clean component lifecycle

---

## 👥 Contributing

### Development Setup
1. Clone repository
2. Navigate to `reader/` folder
3. Start local server: `python -m http.server 8000`
4. Open `http://localhost:8000`

### Code Standards
- **ES6+ Modules**: No bundlers, vanilla JavaScript
- **Single Responsibility**: Each component has clear purpose
- **Clean Architecture**: Dependency injection, no globals
- **Performance First**: Optimize for large EPUB files

### Testing Checklist
- [ ] Words wrap correctly in `.interactive-word` spans
- [ ] Clicks trigger popovers with word definitions
- [ ] Saved words highlight green
- [ ] Sentence context appears in popovers
- [ ] No console errors during operation
- [ ] Performance acceptable for large books

---

## 📞 Support & Issues

**Found a bug?** Create issue on GitHub with:
- Browser and version
- EPUB file (if specific)
- Console errors/logs
- Steps to reproduce

**Need help?** Check:
- This documentation
- Console debugging commands
- Component API examples

---

## 📄 License

MIT License - see LICENSE file for details.

---

## 👨‍💻 Author & Maintainer

**Андрей Чеботарев** - Full-Stack Developer & English Tutor

- **GitHub**: [@andreacebotarev-svg](https://github.com/andreacebotarev-svg)
- **Email**: [contact email]
- **Architecture**: Clean Flow v5.0 (Single Source of Truth)

---

**Last Updated**: January 7, 2026  
**Version**: 5.0.0  
**Architecture**: Clean Flow (Burn & Rebuild)
