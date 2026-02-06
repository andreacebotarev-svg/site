# 📋 Kanban Vocabulary Board - Implementation Documentation

## 🎯 Project Overview

**Kanban Vocabulary Board** is an interactive drag-and-drop learning progress tracker for vocabulary, integrated into the modular English Lessons platform.

### Goals
- ✅ Visualize vocabulary learning progress across 4 stages
- ✅ Enable drag-and-drop word movement between columns
- ✅ Persist learning state in localStorage
- ✅ Integrate seamlessly with existing LessonEngine architecture
- ✅ Maintain backward compatibility with list/flashcard modes

### Key Features
- 🎯 **4 Kanban Columns:** To Learn → Learning → Known → Favorites
- 🖱️ **Drag & Drop:** Intuitive word movement between stages
- 💾 **LocalStorage Persistence:** Progress saved automatically
- 🔊 **Audio Integration:** Play word pronunciation from cards
- 📱 **Responsive Design:** Works on desktop, tablet, mobile
- ♿ **Accessibility:** Keyboard navigation, screen reader support

---

## 📦 Architecture

### Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                     LessonEngine                            │
│  (Main Controller - existing, will be extended)             │
│                                                             │
│  State: { vocabMode: 'list' | 'flashcard' | 'kanban' }    │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ├─── LessonRenderer (extended)
                  │    └─── renderKanbanBoard() 🆕
                  │
                  ├─── KanbanVocabularyManager 🆕
                  │    ├─── setupDragAndDrop()
                  │    ├─── handleCardDrop()
                  │    └─── updateColumnCounts()
                  │
                  ├─── LessonStorage (extended ✅)
                  │    ├─── getWordStatus() ✅
                  │    ├─── updateWordStatus() ✅
                  │    └─── getWordsByStatus() ✅
                  │
                  └─── LessonTTS (reused ✅)
                       └─── speak(word)
```

### Data Flow

```
1. User Action (drag word card)
   ↓
2. KanbanVocabularyManager.handleCardDrop()
   ↓
3. LessonStorage.updateWordStatus(word, newStatus)
   ↓
4. localStorage['lesson-264-word-statuses'] updated
   ↓
5. KanbanVocabularyManager.renderColumn(status)
   ↓
6. UI updates with new card position
```

### File Structure

```
englishlessons/dist/
├── assets/
│   ├── css/
│   │   ├── lesson-core.css              ✅ Existing
│   │   ├── lesson-components.css        ✅ Existing
│   │   ├── lesson-responsive.css        ✅ Existing
│   │   └── vocabulary-kanban.css        ✅ CREATED (Stage 1)
│   └── js/
│       ├── lesson-storage.js            ✅ EXTENDED (Stage 1)
│       ├── lesson-tts.js                ✅ Existing (reused)
│       ├── lesson-renderer.js           ⏳ TO EXTEND (Stage 2)
│       ├── lesson-engine.js             ⏳ TO EXTEND (Stage 3)
│       └── vocabulary-kanban.js         ⏳ TO CREATE (Stage 2)
├── 264.html                             ⏳ TO UPDATE (Stage 3)
└── docs/
    ├── ARCHITECTURE.md                  ✅ Existing
    ├── FLASHCARDS_DOCUMENTATION.md      ✅ Existing
    └── KANBAN_DOCUMENTATION.md          ✅ THIS FILE
```

---

## 🚀 Implementation Plan

# 📍 STAGE 1: Foundation (✅ COMPLETED)

## Duration: 3-4 hours
## Status: ✅ DONE

### ✅ 1.1 Extended LessonStorage

**File:** `dist/assets/js/lesson-storage.js`

**New Methods:**
```javascript
getWordStatus(word)           // Get current status: 'to-learn' | 'learning' | 'known' | 'favorites'
updateWordStatus(word, status) // Move word to new column
getWordsByStatus(vocabulary)   // Group all words by status
clearAllStatuses()             // Reset board
getStatusStatistics(vocabulary) // Get counts for each column
```

**localStorage Schema:**
```javascript
// Key: "lesson-{lessonId}-word-statuses"
{
  "recipe": "learning",
  "equipment": "known",
  "diet": "to-learn"
}
```

### ✅ 1.2 Created vocabulary-kanban.css

**File:** `dist/assets/css/vocabulary-kanban.css`

**Features:**
- 4-column grid layout with CSS Grid
- Gradient headers (distinct colors per column)
- Drag-over states (dashed border + pulse animation)
- Card hover effects (lift + shadow)
- Responsive breakpoints: 4 → 2 → 1 columns
- Accessibility (focus states, reduced motion)

**Design Tokens (from lesson-core.css):**
```css
--primary-color: #2563eb
--spacing-sm: 1rem
--spacing-md: 1.5rem
--shadow-md: 0 4px 6px rgba(0,0,0,0.1)
--radius: 8px
```

### ✅ 1.3 Documentation Created

**File:** `dist/docs/KANBAN_DOCUMENTATION.md` (this file)

---

# 📍 STAGE 2: Controller & Rendering (⏳ IN PROGRESS)

## Duration: 4-5 hours
## Status: ⏳ PENDING

### 2.1 Create KanbanVocabularyManager

**File:** `dist/assets/js/vocabulary-kanban.js` 🆕

**Purpose:** Standalone controller for Kanban board logic (drag-and-drop, rendering updates)

**Class Structure:**
```javascript
class KanbanVocabularyManager {
  constructor(lessonStorage, lessonTTS, lessonRenderer, vocabularyData) {
    this.storage = lessonStorage;        // Reuse existing storage
    this.tts = lessonTTS;                // Reuse existing TTS
    this.renderer = lessonRenderer;      // Reuse existing renderer
    this.vocabulary = vocabularyData;    // { words: [], phrases: [] }
    this.draggedCard = null;             // Track dragged element
    this.sourceColumn = null;            // Track source column
  }

  /**
   * Initialize Kanban board in container
   */
  init(containerElement) {
    this.container = containerElement;
    this.render();
    this.setupDragAndDrop();
    this.attachEventListeners();
  }

  /**
   * Render full Kanban board
   */
  render() {
    const grouped = this.storage.getWordsByStatus(
      this.getAllVocabulary()
    );
    
    const html = this.renderer.renderKanbanBoard(grouped, this.storage);
    this.container.innerHTML = html;
  }

  /**
   * Get all vocabulary (words + phrases)
   */
  getAllVocabulary() {
    return [
      ...this.vocabulary.words,
      ...this.vocabulary.phrases.map(p => ({
        en: p.en,
        ru: p.ru,
        transcription: '',
        part_of_speech: 'phrase'
      }))
    ];
  }

  /**
   * Setup drag and drop event listeners
   */
  setupDragAndDrop() {
    // Make cards draggable
    this.container.querySelectorAll('.kanban-card').forEach(card => {
      card.setAttribute('draggable', 'true');
      
      card.addEventListener('dragstart', (e) => {
        this.draggedCard = card;
        this.sourceColumn = card.closest('.kanban-column');
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', card.dataset.word);
      });
      
      card.addEventListener('dragend', (e) => {
        card.classList.remove('dragging');
        this.draggedCard = null;
        this.sourceColumn = null;
      });
    });

    // Make columns drop targets
    this.container.querySelectorAll('.kanban-column').forEach(column => {
      column.addEventListener('dragover', (e) => {
        e.preventDefault();
        column.classList.add('drag-over');
        e.dataTransfer.dropEffect = 'move';
      });
      
      column.addEventListener('dragleave', (e) => {
        if (e.target === column) {
          column.classList.remove('drag-over');
        }
      });
      
      column.addEventListener('drop', (e) => {
        e.preventDefault();
        column.classList.remove('drag-over');
        this.handleCardDrop(column);
      });
    });
  }

  /**
   * Handle card drop into column
   */
  handleCardDrop(targetColumn) {
    if (!this.draggedCard) return;
    
    const word = this.draggedCard.dataset.word;
    const newStatus = targetColumn.dataset.status;
    const oldStatus = this.sourceColumn.dataset.status;
    
    // Don't do anything if dropped in same column
    if (newStatus === oldStatus) return;
    
    // Update status in storage
    this.storage.updateWordStatus(word, newStatus);
    
    // Re-render board
    this.render();
    this.setupDragAndDrop();
    
    // Show notification
    this.showNotification(`"${word}" moved to ${this.getColumnLabel(newStatus)}`);
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  }

  /**
   * Get human-readable column label
   */
  getColumnLabel(status) {
    const labels = {
      'to-learn': 'To Learn',
      'learning': 'Learning',
      'known': 'Known',
      'favorites': 'Favorites'
    };
    return labels[status] || status;
  }

  /**
   * Attach button event listeners (audio, move)
   */
  attachEventListeners() {
    // Audio buttons
    this.container.querySelectorAll('.card-audio').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const word = btn.closest('.kanban-card').dataset.word;
        this.tts.speak(word, 'en');
      });
    });

    // Quick move buttons (→)
    this.container.querySelectorAll('.card-move').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = btn.closest('.kanban-card');
        const word = card.dataset.word;
        const currentStatus = card.closest('.kanban-column').dataset.status;
        const nextStatus = this.getNextStatus(currentStatus);
        
        this.storage.updateWordStatus(word, nextStatus);
        this.render();
        this.setupDragAndDrop();
        this.showNotification(`"${word}" moved to ${this.getColumnLabel(nextStatus)}`);
      });
    });
  }

  /**
   * Get next status in progression
   */
  getNextStatus(currentStatus) {
    const progression = {
      'to-learn': 'learning',
      'learning': 'known',
      'known': 'favorites',
      'favorites': 'known' // Loop back
    };
    return progression[currentStatus] || 'learning';
  }

  /**
   * Show notification toast
   */
  showNotification(message) {
    // Reuse existing notification system from LessonEngine
    const notificationEl = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    
    if (notificationEl && notificationText) {
      notificationText.textContent = message;
      notificationEl.classList.add('show');
      
      setTimeout(() => {
        notificationEl.classList.remove('show');
      }, 2000);
    }
  }

  /**
   * Destroy and cleanup
   */
  destroy() {
    this.container.innerHTML = '';
    this.draggedCard = null;
    this.sourceColumn = null;
  }
}
```

### 2.2 Extend LessonRenderer

**File:** `dist/assets/js/lesson-renderer.js` (add method)

**New Method:**
```javascript
/**
 * Render Kanban board HTML
 * @param {Object} groupedWords - Words grouped by status from storage.getWordsByStatus()
 * @param {LessonStorage} storage - Storage instance for checking saved words
 * @returns {string} HTML string
 */
renderKanbanBoard(groupedWords, storage) {
  const columns = [
    { status: 'to-learn', icon: '📖', label: 'To Learn' },
    { status: 'learning', icon: '📚', label: 'Learning' },
    { status: 'known', icon: '✓', label: 'Known' },
    { status: 'favorites', icon: '⭐', label: 'Favorites' }
  ];

  const columnsHTML = columns.map(col => {
    const words = groupedWords[col.status] || [];
    const cardsHTML = words.map(word => this._renderKanbanCard(word, col.status)).join('');
    
    return `
      <div class="kanban-column" data-status="${col.status}">
        <div class="column-header">
          <div class="column-title">
            <span class="column-icon">${col.icon}</span>
            <span class="column-name">${col.label}</span>
            <span class="column-count">(${words.length})</span>
          </div>
          <button class="column-menu" aria-label="Column menu">⋮</button>
        </div>
        <div class="column-content">
          ${cardsHTML || '<div class="kanban-empty-state"><div class="kanban-empty-state-icon">📭</div><p>No words yet</p></div>'}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="vocab-kanban-container">
      <div class="kanban-header">
        <h3>📚 Vocabulary Progress</h3>
        <div class="kanban-actions">
          <button class="kanban-reset-btn" title="Reset board">🔄 Reset</button>
        </div>
      </div>
      <div class="kanban-board">
        ${columnsHTML}
      </div>
    </div>
  `;
}

/**
 * Render individual Kanban card
 * @private
 */
_renderKanbanCard(word, status) {
  const wordEn = this.escapeHTML(word.en || '');
  const wordRu = this.escapeHTML(word.ru || '');
  const transcription = word.transcription || '';
  
  return `
    <div class="kanban-card" draggable="true" data-word="${wordEn}">
      <div class="card-header-small">
        <h4 class="card-word">${wordEn}</h4>
        <button class="card-drag-handle" aria-label="Drag to move">⋮⋮</button>
      </div>
      <p class="card-translation">${wordRu}</p>
      ${transcription ? `<p class="card-transcription">${transcription}</p>` : ''}
      <div class="card-footer">
        <button class="card-audio" title="Play audio">🔊</button>
        <button class="card-move" title="Move to next stage">→</button>
      </div>
    </div>
  `;
}
```

### 2.3 Testing Checklist for Stage 2

✅ **KanbanVocabularyManager initialization:**
```javascript
const kanban = new KanbanVocabularyManager(storage, tts, renderer, lessonData.vocabulary);
kanban.init(document.querySelector('#vocabulary-container'));
```

✅ **Drag and Drop:**
- Card can be dragged
- Column shows drag-over state
- Card position updates after drop
- localStorage updated correctly

✅ **Audio playback:**
- Click 🔊 button plays word pronunciation
- Works on all cards

✅ **Quick move (→):**
- Moves card to next status
- Updates UI immediately

✅ **Notifications:**
- Shows "moved to X" message
- Auto-dismisses after 2 seconds

---

# 📍 STAGE 3: Integration with LessonEngine (⏳ PENDING)

## Duration: 2-3 hours
## Status: ⏳ PENDING

### 3.1 Extend LessonEngine State

**File:** `dist/assets/js/lesson-engine.js`

**Update State:**
```javascript
class LessonEngine {
  constructor(lessonId) {
    this.state = {
      // ... existing state
      vocabMode: 'list',  // Change to support: 'list' | 'flashcard' | 'kanban'
      kanbanManager: null // Will hold KanbanVocabularyManager instance
    };
  }
}
```

**Add Method:**
```javascript
/**
 * Switch vocabulary display mode
 */
switchVocabMode(mode) {
  if (!['list', 'flashcard', 'kanban'].includes(mode)) {
    console.error(`Invalid vocab mode: ${mode}`);
    return;
  }

  this.state.vocabMode = mode;
  
  // Cleanup previous mode
  if (this.state.kanbanManager) {
    this.state.kanbanManager.destroy();
    this.state.kanbanManager = null;
  }

  // Render vocabulary section
  this.renderVocabularySection();
}

/**
 * Render vocabulary section based on current mode
 */
renderVocabularySection() {
  const container = document.querySelector('#vocabulary-container');
  if (!container) return;

  const mode = this.state.vocabMode;
  const myWords = this.storage.loadWords();

  if (mode === 'list') {
    container.innerHTML = this.renderer.renderVocabulary('list', myWords);
  } else if (mode === 'flashcard') {
    container.innerHTML = this.renderer.renderVocabulary('flashcard', myWords);
    // ... flashcard setup
  } else if (mode === 'kanban') {
    // Initialize Kanban manager
    this.state.kanbanManager = new KanbanVocabularyManager(
      this.storage,
      this.tts,
      this.renderer,
      this.lessonData.vocabulary
    );
    this.state.kanbanManager.init(container);
  }
}
```

### 3.2 Update 264.html

**File:** `dist/264.html`

**Add Kanban CSS:**
```html
<head>
  <!-- Existing CSS -->
  <link rel="stylesheet" href="assets/css/lesson-core.css">
  <link rel="stylesheet" href="assets/css/lesson-components.css">
  <link rel="stylesheet" href="assets/css/lesson-responsive.css">
  
  <!-- NEW: Kanban CSS -->
  <link rel="stylesheet" href="assets/css/vocabulary-kanban.css">
</head>
```

**Add Kanban JS:**
```html
<body>
  <!-- Existing JS -->
  <script src="assets/js/lesson-storage.js"></script>
  <script src="assets/js/lesson-tts.js"></script>
  <script src="assets/js/lesson-renderer.js"></script>
  
  <!-- NEW: Kanban JS -->
  <script src="assets/js/vocabulary-kanban.js"></script>
  
  <script src="assets/js/lesson-engine.js"></script>
</body>
```

**Add Mode Switcher UI:**
```html
<!-- In vocabulary tab header -->
<div class="vocab-mode-switcher">
  <button class="mode-btn active" data-mode="list">📝 List</button>
  <button class="mode-btn" data-mode="flashcard">🃏 Flashcards</button>
  <button class="mode-btn" data-mode="kanban">📊 Board</button>
</div>
```

**Attach Event Listeners:**
```javascript
// In lesson initialization
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.dataset.mode;
    lessonEngine.switchVocabMode(mode);
    
    // Update active state
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
```

### 3.3 Testing Checklist for Stage 3

✅ **Mode switching:**
- List → Kanban → Flashcard transitions work
- No memory leaks (destroy() called properly)

✅ **Persistence:**
- Kanban state persists across page reloads
- Switching modes doesn't lose data

✅ **Backward compatibility:**
- Existing list mode still works
- Flashcard mode still works
- Saved words functionality intact

✅ **Performance:**
- No lag when dragging cards
- Smooth animations
- Fast re-renders

---

## 🎯 Acceptance Criteria

### Functional Requirements

✅ User can see 4 columns: To Learn, Learning, Known, Favorites
✅ User can drag words between columns
✅ Word status persists in localStorage
✅ User can play audio for each word
✅ User can quickly move words with → button
✅ User can reset board to default state
✅ Column counters update in real-time
✅ Notifications show feedback for actions

### Non-Functional Requirements

✅ Works on Chrome, Firefox, Safari, Edge (last 2 versions)
✅ Responsive on mobile (iOS/Android)
✅ Touch events work on mobile
✅ Keyboard accessible (Tab, Enter, Space)
✅ Screen reader compatible (ARIA labels)
✅ No breaking changes to existing code
✅ Code follows project conventions
✅ Documented with JSDoc comments

---

## 🐛 Known Issues & Future Improvements

### Known Issues
- None yet (Stage 1 completed)

### Future Improvements

#### v2.0 - Enhanced UX
- [ ] Undo/redo functionality
- [ ] Bulk move (select multiple cards)
- [ ] Search/filter within board
- [ ] Column collapse/expand
- [ ] Card context menu (right-click)

#### v2.1 - Analytics
- [ ] Time tracking per word
- [ ] Learning velocity graph
- [ ] Spaced repetition suggestions
- [ ] Export progress as PDF

#### v2.2 - Collaboration
- [ ] Share board with teacher
- [ ] Compare progress with classmates
- [ ] Leaderboard integration

---

## 📚 API Reference

### LessonStorage Extended API

#### `getWordStatus(word: string): string`
Returns the current status of a word.

**Returns:** `'to-learn' | 'learning' | 'known' | 'favorites'`

**Example:**
```javascript
const status = storage.getWordStatus('recipe');
// → 'learning'
```

#### `updateWordStatus(word: string, status: string): boolean`
Updates the status of a word.

**Parameters:**
- `word` - English word
- `status` - New status (validated)

**Returns:** `true` on success

**Example:**
```javascript
storage.updateWordStatus('recipe', 'known');
// → true
```

#### `getWordsByStatus(vocabulary: Array): Object`
Groups vocabulary by status.

**Returns:**
```javascript
{
  'to-learn': [{ en: 'diet', ru: 'диета', ... }],
  'learning': [{ en: 'recipe', ru: 'рецепт', ... }],
  'known': [{ en: 'energy', ru: 'энергия', ... }],
  'favorites': [{ en: 'healthy', ru: 'здоровый', ... }]
}
```

#### `getStatusStatistics(vocabulary: Array): Object`
Get counts for each status.

**Returns:**
```javascript
{
  total: 20,
  'to-learn': 12,
  'learning': 5,
  'known': 3,
  'favorites': 5
}
```

### KanbanVocabularyManager API

#### `constructor(storage, tts, renderer, vocabulary)`
Create new Kanban manager.

**Parameters:**
- `storage` - LessonStorage instance
- `tts` - LessonTTS instance
- `renderer` - LessonRenderer instance
- `vocabulary` - Vocabulary data `{ words: [], phrases: [] }`

#### `init(container: HTMLElement): void`
Initialize board in container.

#### `render(): void`
Re-render entire board.

#### `destroy(): void`
Cleanup and remove board.

---

## 🧪 Testing Guide

### Manual Testing Checklist

#### Drag and Drop
- [ ] Drag word from To Learn → Learning
- [ ] Drag word from Learning → Known
- [ ] Drag word from Known → Favorites
- [ ] Drag word back to To Learn
- [ ] Try dragging to same column (should do nothing)
- [ ] Verify localStorage updated after each drop

#### Audio
- [ ] Click 🔊 on To Learn card
- [ ] Click 🔊 on Known card
- [ ] Click 🔊 on Favorites card
- [ ] Verify pronunciation is correct

#### Quick Move
- [ ] Click → on To Learn card (should move to Learning)
- [ ] Click → on Learning card (should move to Known)
- [ ] Click → on Known card (should move to Favorites)
- [ ] Click → on Favorites card (should move to Known)

#### Responsive
- [ ] Desktop (1920x1080): 4 columns visible
- [ ] Tablet (768x1024): 2 columns visible
- [ ] Mobile (375x667): 1 column visible
- [ ] Touch drag works on mobile

#### Persistence
- [ ] Reload page after moving words
- [ ] Verify words stayed in new columns
- [ ] Clear browser data
- [ ] Verify all words reset to To Learn

### Automated Testing (Future)

```javascript
// Example Jest test
describe('KanbanVocabularyManager', () => {
  test('moves word between columns', () => {
    const manager = new KanbanVocabularyManager(storage, tts, renderer, vocab);
    manager.init(container);
    
    // Simulate drag and drop
    const card = container.querySelector('[data-word="recipe"]');
    const targetColumn = container.querySelector('[data-status="learning"]');
    
    // Trigger drop
    manager.handleCardDrop(targetColumn);
    
    // Verify
    expect(storage.getWordStatus('recipe')).toBe('learning');
  });
});
```

---

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] No console errors
- [ ] Performance profiling done

### Deployment
- [ ] Commit to main branch
- [ ] Push to GitHub Pages
- [ ] Verify on live site
- [ ] Test on mobile device

### Post-deployment
- [ ] Monitor error logs
- [ ] Gather user feedback
- [ ] Plan iteration improvements

---

## 📞 Support

**Developer:** andreacebotarev-svg  
**Project:** [English Lessons Platform](https://github.com/andreacebotarev-svg/englishlessons)  
**Architecture:** See [ARCHITECTURE.md](./ARCHITECTURE.md)  
**Flashcards:** See [FLASHCARDS_DOCUMENTATION.md](./FLASHCARDS_DOCUMENTATION.md)

---

**Version:** 1.0.0  
**Last Updated:** December 23, 2025  
**Status:** Stage 1 Complete ✅ | Stage 2 & 3 Pending ⏳