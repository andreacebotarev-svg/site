# 📚 English Lessons Platform - Architecture Documentation

## 🎯 Project Overview

**English Lessons Platform** is an interactive web-based language learning application designed for A0-B2 level English learners. The platform combines reading comprehension, vocabulary acquisition, grammar lessons, and gamified learning through flashcards and Kanban-style progress tracking.

### Live Demo
- **URL**: https://andreacebotarev-svg.github.io/englishlessons/dist/264.html
- **Lesson**: "Cooking at School" (Level B1, 45 minutes)

---

## 🏗️ System Architecture

### Architecture Pattern
**Model-View-Controller (MVC) with Event-Driven Communication**

```
┌─────────────────────────────────────────────────────────────┐
│                      264.html (Entry Point)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ CSS Modules  │  │ JS Modules   │  │ JSON Data    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    LessonEngine (Controller)                 │
│  • Application state management                              │
│  • Tab navigation and routing                                │
│  • User interaction coordination                             │
│  • Event bus subscriber                                      │
└─────────────────────────────────────────────────────────────┘
         │                  │                  │
         ▼                  ▼                  ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│LessonStorage│   │LessonRenderer│   │  LessonTTS  │
│   (Model)   │   │    (View)    │   │  (Service)  │
│             │   │              │   │             │
│• Save words │   │• HTML gen    │   │• Speech API │
│• Statuses   │   │• Templates   │   │• Audio play │
│• LocalStore │   │• Sanitization│   │• Vibration  │
└─────────────┘   └─────────────┘   └─────────────┘
                          │
                          ▼
         ┌────────────────────────────────┐
         │   Specialized Controllers       │
         │  ┌──────────────────────────┐  │
         │  │  KanbanController        │  │
         │  │  • Drag-and-drop logic   │  │
         │  │  • Event emission        │  │
         │  │  • Listener management   │  │
         │  └──────────────────────────┘  │
         │  ┌──────────────────────────┐  │
         │  │  SimpleEventBus          │  │
         │  │  • Pub/Sub pattern       │  │
         │  │  • Event broadcasting    │  │
         │  └──────────────────────────┘  │
         └────────────────────────────────┘
```

---

## 📦 Core Modules

### 1. **LessonEngine** (Main Controller)
**File**: `dist/assets/js/lesson-engine.js`

**Responsibilities:**
- Application lifecycle management
- State management (tabs, modes, quiz progress)
- User interaction orchestration
- Event bus coordination
- API integration (Google Translate)

**Key Properties:**
```javascript
class LessonEngine {
  lessonId: string              // Lesson identifier (e.g., "264")
  currentTab: string            // 'reading' | 'vocabulary' | 'grammar' | 'mywords'
  vocabMode: string             // 'list' | 'flashcard' | 'kanban'
  flashcardIndex: number        // Current flashcard position
  myWords: Array<Word>          // Saved vocabulary
  quizState: QuizState          // Quiz progress tracking
  eventBus: SimpleEventBus      // Event communication system
  kanbanController: KanbanController  // Kanban board controller
}
```

**Key Methods:**
- `init()` - Load lesson data and initialize UI
- `switchTab(tabName)` - Navigate between tabs
- `switchVocabMode(mode)` - Switch vocabulary display modes
- `showWordPopup(word, event)` - Display translation popup
- `translateWord(word)` - Fetch translation from Google Translate API
- `handleKanbanWordMoved(data)` - Process Kanban status changes
- `setupKanbanListeners()` - Initialize Kanban drag-and-drop

---

### 2. **LessonRenderer** (View Layer)
**File**: `dist/assets/js/lesson-renderer.js`

**Responsibilities:**
- HTML generation for all UI components
- Template rendering
- XSS protection (HTML escaping)
- Interactive word highlighting

**Key Methods:**
```javascript
// Main rendering methods
renderVocabulary(mode, myWords, flashcardIndex)  // List/Flashcard/Kanban
renderReading(myWords)                           // Reading content + quiz
renderGrammar()                                  // Grammar rules
renderKanbanBoard(groupedWords, storage)         // Kanban board

// Specialized renderers
_renderKanbanCard(word, status)                  // Individual card
_renderKanbanEmptyState(columnLabel)             // Empty column placeholder
renderFlashcard(vocabulary, index)               // Flashcard view
renderQuiz(quizState)                            // Quiz interface

// Utility methods
makeWordsInteractive(text)                       // Clickable words
escapeHTML(text)                                 // XSS protection
```

**Rendering Flow:**
```
LessonEngine.render()
    ↓
LessonEngine.renderCurrentTab()
    ↓
LessonRenderer.renderVocabulary(mode) / renderReading() / etc.
    ↓
HTML injected into #tab-content
    ↓
LessonEngine.attachCurrentTabListeners()
```

---

### 3. **LessonStorage** (Data Persistence)
**File**: `dist/assets/js/lesson-storage.js`

**Responsibilities:**
- LocalStorage management
- Word save/remove operations
- Kanban status tracking
- Data retrieval and filtering

**Storage Schema:**
```javascript
// LocalStorage keys
`lesson_${lessonId}_words`      // Saved words array
`lesson_${lessonId}_statuses`   // Word status map

// Word object structure
{
  word: string,                 // English word
  definition: string,           // Russian translation
  phonetic: string,             // IPA transcription
  timestamp: number,            // Save time (ms)
  status?: string               // 'to-learn' | 'learning' | 'known' | 'favorites'
}

// Status map structure
{
  "word1": "learning",
  "word2": "known",
  ...
}
```

**Key Methods:**
- `addWord(wordData)` - Save new word
- `removeWord(word)` - Delete word
- `isWordSaved(word)` - Check if word exists
- `updateWordStatus(word, status)` - Update Kanban status
- `getWordsByStatus(vocabulary)` - Group words by status
- `clearAllStatuses()` - Reset Kanban board

---

### 4. **KanbanController** (Drag-and-Drop Logic)
**File**: `dist/assets/js/vocabulary-kanban.js`

**Responsibilities:**
- Drag-and-drop event management
- Event listener lifecycle (attach/detach)
- Visual feedback during drag operations
- Event emission to LessonEngine

**Event Listeners:**
```javascript
// Card drag events
dragstart  → _onDragStart()   // Card picked up
dragend    → _onDragEnd()     // Card released

// Column drop events
dragover   → _onDragOver()    // Hovering over column
dragenter  → _onDragEnter()   // Entered column area
dragleave  → _onDragLeave()   // Left column area
drop       → _onDrop()        // Card dropped in column

// Button clicks
click (audio)  → _handleAudioClick()  // Play pronunciation
click (move)   → _handleMoveClick()   // Cycle status
click (reset)  → _handleResetClick()  // Reset all
```

**Listener Management Pattern:**
```javascript
// Array-based tracking for proper cleanup
attachedListeners = [
  {
    element: HTMLElement,      // DOM reference
    eventType: string,         // 'click', 'dragstart', etc.
    handler: Function,         // Event handler
    id: number                 // Unique identifier
  }
]

// Attach phase
attach(container) {
  element.addEventListener(eventType, handler)
  this._registerListener(element, eventType, handler)
}

// Detach phase
detach() {
  attachedListeners.forEach(({element, eventType, handler}) => {
    element.removeEventListener(eventType, handler)
  })
  attachedListeners = []
}
```

---

### 5. **SimpleEventBus** (Pub/Sub Pattern)
**File**: `dist/assets/js/vocabulary-kanban.js`

**Responsibilities:**
- Event broadcasting between modules
- Decoupled component communication
- Error handling in listeners

**Event Types:**
```javascript
'kanban:word-moved'       // Card moved between columns
'kanban:audio-requested'  // Audio button clicked
'kanban:reset-requested'  // Reset button clicked
```

**Usage Pattern:**
```javascript
// Publisher (KanbanController)
this.eventBus.emit('kanban:word-moved', {
  word: 'cheese',
  oldStatus: 'to-learn',
  newStatus: 'learning'
})

// Subscriber (LessonEngine)
this.eventBus.on('kanban:word-moved', (data) => {
  this.storage.updateWordStatus(data.word, data.newStatus)
  this.renderCurrentTab()
})
```

---

### 6. **LessonTTS** (Text-to-Speech Service)
**File**: `dist/assets/js/lesson-tts.js`

**Responsibilities:**
- Web Speech API integration
- Sequential text reading
- Haptic feedback (vibration)
- Error handling for unsupported browsers

**Key Methods:**
```javascript
speak(text, lang = 'en')           // Single utterance
speakSequence(texts, pauseMs)      // Multiple utterances with pauses
vibrate(duration)                  // Haptic feedback
```

---

## 🎨 CSS Architecture

### Modular CSS Structure
```
dist/assets/css/
├── lesson-core.css           # CSS variables, typography, base styles
├── lesson-components.css     # Buttons, cards, tabs, forms
├── lesson-responsive.css     # Media queries, mobile optimizations
└── vocabulary-kanban.css     # Kanban board specific styles
```

### CSS Variables (Design Tokens)
```css
:root {
  /* Colors */
  --bg-main: #0a0d1e;
  --bg-secondary: #13182e;
  --text-main: #e2e4ed;
  --text-soft: #9ca3af;
  --accent: #4f8cff;
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  
  /* Typography */
  --font-size-base: 16px;
  --line-height-base: 1.6;
  
  /* Effects */
  --shadow-sm: 0 2px 8px rgba(0,0,0,0.1);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.15);
  --radius-md: 12px;
  --transition-base: 0.2s ease;
}
```

---

## 📊 Data Flow

### Lesson Loading Flow
```
1. 264.html loads
   ↓
2. Extract lessonId from filename ("264")
   ↓
3. Initialize LessonEngine(lessonId)
   ↓
4. LessonEngine.init()
   ├─→ Fetch ../data/264.json
   ├─→ Load saved words from LocalStorage
   ├─→ Initialize modules (Storage, TTS, Renderer)
   └─→ Render UI
   ↓
5. Show lesson content
```

### Vocabulary Save Flow
```
User clicks word in reading
   ↓
showWordPopup(word, event)
   ├─→ Fetch translation from Google Translate API
   ├─→ Check if word is in vocabulary
   └─→ Display popup with "Save" button
   ↓
User clicks "Save"
   ↓
toggleWordFromPopup(word, translation)
   ├─→ storage.addWord({word, definition, phonetic, timestamp})
   ├─→ Save to LocalStorage
   ├─→ Update myWords array
   └─→ Re-render current tab (updates highlighting)
   ↓
Word highlighted in green across all tabs
```

### Kanban Drag-and-Drop Flow
```
User drags card "cheese"
   ↓
KanbanController._onDragStart()
   ├─→ card.classList.add('dragging')
   ├─→ Store draggedCard reference
   └─→ Set dataTransfer
   ↓
User hovers over "Learning" column
   ↓
KanbanController._onDragEnter()
   └─→ column.classList.add('drag-over')
   ↓
User releases mouse
   ↓
KanbanController._onDrop()
   ├─→ Extract word, oldStatus, newStatus
   ├─→ eventBus.emit('kanban:word-moved', {word, oldStatus, newStatus})
   └─→ column.classList.remove('drag-over')
   ↓
LessonEngine.handleKanbanWordMoved(data)
   ├─→ storage.updateWordStatus(word, newStatus)
   ├─→ showNotification("cheese moved to Learning")
   └─→ renderCurrentTab() // Re-renders Kanban with updated positions
```

### Move Button Click Flow
```
User clicks → button in card
   ↓
KanbanController._handleMoveClick()
   ├─→ Get current status from column dataset
   ├─→ Calculate next status (to-learn → learning → known → favorites → to-learn)
   ├─→ Visual feedback (button pulse animation)
   └─→ eventBus.emit('kanban:word-moved', {word, oldStatus, newStatus})
   ↓
[Same flow as drag-and-drop from here]
```

---

## 🔄 State Management

### Application State
```javascript
// LessonEngine internal state
{
  lessonId: "264",
  currentTab: "vocabulary",       // Active tab
  vocabMode: "kanban",            // Vocabulary display mode
  flashcardIndex: 0,              // Flashcard position
  myWords: [                      // Saved words
    {
      word: "cheese",
      definition: "сыр",
      phonetic: "[tʃiːz]",
      timestamp: 1703347200000,
      status: "learning"
    }
  ],
  quizState: {                    // Quiz progress
    currentQuestionIndex: 0,
    answers: [],
    completed: false
  }
}
```

### Persistent State (LocalStorage)
```javascript
// Saved words
localStorage['lesson_264_words'] = JSON.stringify([
  {word: "cheese", definition: "сыр", phonetic: "[tʃiːz]", timestamp: 1703347200000}
])

// Kanban statuses
localStorage['lesson_264_statuses'] = JSON.stringify({
  "cheese": "learning",
  "milk": "known",
  "butter": "favorites"
})
```

---

## 🎯 Feature Implementation Details

### 1. Interactive Reading
**Implementation:**
- All words wrapped in `<span class="interactive-word">`
- Click triggers `showWordPopup(word, event)`
- Google Translate API fallback to vocabulary data
- Smart popup positioning (above/below based on viewport space)
- Saved words highlighted with green background

### 2. Vocabulary Modes
**List Mode:**
- Vertical scrollable list
- Audio button + Save/Remove button per word
- Responsive grid layout

**Flashcard Mode:**
- 3D flip animation on click
- Navigation buttons (Prev/Next)
- Front: English word + image
- Back: Russian translation + example

**Kanban Mode:**
- 4 columns: To Learn, Learning, Known, Favorites
- Drag-and-drop between columns
- Move button for quick status cycling
- Audio button in each card
- Reset button to clear all progress

### 3. Kanban Board
**Technical Details:**
- HTML5 Drag and Drop API
- Event-driven status updates
- Optimistic UI updates
- Proper listener cleanup on mode switch
- Visual feedback (drag-over highlight, button pulse)

**Status Cycle:**
```
📖 To Learn → 📚 Learning → ✓ Known → ⭐ Favorites → 📖 To Learn
```

### 4. Quiz System
**Embedded in Reading Tab:**
- Multiple choice questions
- Instant feedback on answer selection
- Progress tracking (X / Y questions)
- Explanation text after answer
- Results summary with percentage
- Reset functionality

### 5. Text-to-Speech
**Features:**
- Web Speech API integration
- Individual word pronunciation
- Sequential reading (all paragraphs)
- Adjustable speech rate
- Fallback for unsupported browsers

---

## 🔧 Technical Stack

### Frontend
- **HTML5**: Semantic structure, drag-and-drop
- **CSS3**: Variables, Grid, Flexbox, animations
- **Vanilla JavaScript (ES6+)**: Classes, async/await, modules

### APIs
- **Web Speech API**: Text-to-speech
- **Google Translate API**: Word translation
- **LocalStorage API**: Data persistence
- **Vibration API**: Haptic feedback

### Build Tools
- None (vanilla JavaScript, no bundler)

### Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile: iOS Safari 14+, Chrome Android 90+

---

## 📁 Project Structure

```
englishlessons/
├── dist/
│   ├── 264.html                      # Entry point
│   ├── assets/
│   │   ├── css/
│   │   │   ├── lesson-core.css
│   │   │   ├── lesson-components.css
│   │   │   ├── lesson-responsive.css
│   │   │   └── vocabulary-kanban.css
│   │   ├── js/
│   │   │   ├── lesson-engine.js          # Main controller
│   │   │   ├── lesson-renderer.js        # View layer
│   │   │   ├── lesson-storage.js         # Data persistence
│   │   │   ├── lesson-tts.js             # Speech service
│   │   │   ├── vocabulary-kanban.js      # Kanban logic
│   │   │   └── lesson-debug.js           # Debug utilities
│   │   └── images/
│   │       └── favicon.svg
│   └── images/
│       ├── 264(1).jpg                    # Lesson images
│       ├── 264(2).jpg
│       └── ...
├── data/
│   └── 264.json                          # Lesson content
├── docs/
│   └── ARCHITECTURE.md                   # This file
└── README.md
```

---

## 🚀 Performance Optimizations

### 1. Lazy Loading
- Images load with `loading="lazy"` attribute
- Kanban controller initialized only when needed
- Event listeners attached only for active tab

### 2. Event Delegation
- Word clicks handled via delegation (not per-word listeners)
- Single event bus for all Kanban events

### 3. DOM Optimization
- Minimal re-renders (only changed tab content)
- Efficient HTML escaping
- RequestAnimationFrame for animations

### 4. Memory Management
- Proper listener cleanup on mode switch
- Array-based listener tracking (prevents leaks)
- LocalStorage size monitoring

---

## 🐛 Debugging

### Console Helpers
```javascript
// Inspect word popup
debugPopup.inspect('word')

// Highlight popup with red border
debugPopup.highlight('word')

// Show debug panel
debugPopup.panel('word')
```

### Logging Patterns
```javascript
// Module-prefixed logs
console.log('[LessonEngine] Initializing...')
console.log('[KanbanController] Attached 47 listeners')
console.log('[LessonStorage] Saved word:', word)
```

### Common Issues
1. **Listeners not working**: Check detach() was called before re-attaching
2. **Popup not visible**: Check z-index and overflow clipping
3. **Words not saving**: Check LocalStorage quota (5-10MB limit)
4. **Drag not working**: Ensure `draggable="true"` and listeners attached

---

## 📈 Future Enhancements

### Planned Features
- [ ] Spaced repetition algorithm for vocabulary
- [ ] Export saved words to CSV/JSON
- [ ] Cloud sync (Firebase/Supabase)
- [ ] Audio recording for pronunciation practice
- [ ] Collaborative learning (share progress with friends)
- [ ] Dark/light theme toggle
- [ ] Offline mode with Service Worker
- [ ] Progress analytics dashboard

### Technical Improvements
- [ ] TypeScript migration
- [ ] Unit tests (Jest)
- [ ] E2E tests (Playwright)
- [ ] Bundle optimization (Vite/Rollup)
- [ ] PWA support
- [ ] Accessibility audit (WCAG 2.1 AA)

---

## 📝 Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for development setup and guidelines.

---

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details.

---

**Last Updated**: December 23, 2025  
**Version**: 1.0.0  
**Maintainer**: @andreacebotarev-svg
