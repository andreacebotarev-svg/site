# 📋 STAGE 3: LessonEngine Integration Guide

## 🎯 Цель

Интегрировать Kanban board в `LessonEngine` с минимальными изменениями существующего кода.

---

## ✅ Prerequisites (Already Done)

- ✅ **Stage 1**: `lesson-storage.js` extended with Kanban methods
- ✅ **Stage 1**: `vocabulary-kanban.css` created
- ✅ **Stage 2**: `vocabulary-kanban.js` with `KanbanController` and `SimpleEventBus`
- ✅ **Stage 2**: `lesson-renderer.js` extended with `renderKanbanBoard()`

---

## 📦 Files to Modify

### 1. `lesson.html` (Add Script Tags)

**Location:** `dist/lesson.html`

**Changes:**

```html
<!-- ADD BEFORE closing </head> tag -->
<link rel="stylesheet" href="assets/css/vocabulary-kanban.css">

<!-- ADD BEFORE lesson-engine.js script tag -->
<script src="assets/js/vocabulary-kanban.js"></script>
```

**Full order should be:**

```html
<!-- CSS -->
<link rel="stylesheet" href="assets/css/lesson-styles.css">
<link rel="stylesheet" href="assets/css/vocabulary-kanban.css"> <!-- NEW -->

<!-- JS -->
<script src="assets/js/lesson-storage.js"></script>
<script src="assets/js/lesson-tts.js"></script>
<script src="assets/js/lesson-renderer.js"></script>
<script src="assets/js/vocabulary-kanban.js"></script> <!-- NEW -->
<script src="assets/js/lesson-engine.js"></script>
```

---

### 2. `lesson-engine.js` (Main Integration)

**Location:** `dist/assets/js/lesson-engine.js`

#### Step 1: Add EventBus and KanbanController to Constructor

**Find this section in constructor:**

```javascript
class LessonEngine {
  constructor() {
    this.lessonId = null;
    this.lessonData = null;
    this.storage = new LessonStorage();
    this.tts = new TTSManager();
    this.renderer = null;
    
    // Vocabulary state
    this.vocabMode = 'list'; // 'list', 'flashcard'
    this.flashcardIndex = 0;
    
    // Quiz state
    this.quizState = {
      currentQuestionIndex: 0,
      answers: [],
      completed: false
    };
  }
}
```

**Replace with:**

```javascript
class LessonEngine {
  constructor() {
    this.lessonId = null;
    this.lessonData = null;
    this.storage = new LessonStorage();
    this.tts = new TTSManager();
    this.renderer = null;
    
    // ✨ NEW: Event bus for Kanban communication
    this.eventBus = new SimpleEventBus();
    
    // ✨ NEW: Kanban controller (lazy initialized)
    this.kanbanController = null;
    
    // Vocabulary state
    this.vocabMode = 'list'; // 'list', 'flashcard', 'kanban' ← ADD 'kanban'
    this.flashcardIndex = 0;
    
    // Quiz state
    this.quizState = {
      currentQuestionIndex: 0,
      answers: [],
      completed: false
    };
  }
}
```

---

#### Step 2: Update `attachVocabularyListeners()`

**Find this method:**

```javascript
attachVocabularyListeners() {
  const vocabModeButtons = document.querySelectorAll('.vocab-mode-btn');
  vocabModeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mode = e.target.dataset.mode;
      this.switchVocabMode(mode);
    });
  });
}
```

**Replace with:**

```javascript
attachVocabularyListeners() {
  const vocabModeButtons = document.querySelectorAll('.vocab-mode-btn');
  vocabModeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mode = e.target.dataset.mode;
      this.switchVocabMode(mode);
    });
  });
  
  // ✨ NEW: Setup Kanban event listeners (if in kanban mode)
  if (this.vocabMode === 'kanban') {
    this.setupKanbanListeners();
  }
}
```

---

#### Step 3: Update `switchVocabMode()`

**Find this method:**

```javascript
switchVocabMode(mode) {
  if (mode === this.vocabMode) return;
  
  this.vocabMode = mode;
  
  if (mode === 'flashcard') {
    this.flashcardIndex = 0;
  }
  
  this.renderVocabularySection();
}
```

**Replace with:**

```javascript
switchVocabMode(mode) {
  if (mode === this.vocabMode) return;
  
  // ✨ NEW: Cleanup Kanban controller when leaving kanban mode
  if (this.vocabMode === 'kanban' && this.kanbanController) {
    this.kanbanController.detach();
  }
  
  this.vocabMode = mode;
  
  if (mode === 'flashcard') {
    this.flashcardIndex = 0;
  }
  
  this.renderVocabularySection();
  
  // ✨ NEW: Setup Kanban after rendering
  if (mode === 'kanban') {
    this.setupKanbanListeners();
  }
}
```

---

#### Step 4: Update `renderVocabularySection()`

**Find this method:**

```javascript
renderVocabularySection() {
  const myWords = this.storage.getMyWords(this.lessonId);
  const html = this.renderer.renderVocabulary(
    this.vocabMode,
    myWords,
    this.flashcardIndex
  );
  this.vocabularyContainer.innerHTML = html;
  this.attachVocabularyListeners();
}
```

**Replace with:**

```javascript
renderVocabularySection() {
  const myWords = this.storage.getMyWords(this.lessonId);
  
  // ✨ NEW: Handle Kanban mode separately
  if (this.vocabMode === 'kanban') {
    this.renderKanbanMode();
    return;
  }
  
  // Original rendering for list/flashcard
  const html = this.renderer.renderVocabulary(
    this.vocabMode,
    myWords,
    this.flashcardIndex
  );
  this.vocabularyContainer.innerHTML = html;
  this.attachVocabularyListeners();
}
```

---

#### Step 5: Add NEW `renderKanbanMode()` Method

**Add this NEW method after `renderVocabularySection()`:**

```javascript
/**
 * ✨ NEW: Render Kanban board mode
 */
renderKanbanMode() {
  // Get vocabulary from lesson data
  const vocabulary = this.lessonData?.vocabulary?.words || [];
  
  if (vocabulary.length === 0) {
    this.vocabularyContainer.innerHTML = `
      <div class="card-header">
        <h2 class="card-title">📚 Vocabulary</h2>
      </div>
      <p class="text-soft">No vocabulary available for Kanban board.</p>
    `;
    return;
  }
  
  // Group words by status
  const groupedWords = this.storage.getWordsByStatus(vocabulary);
  
  // Render header with mode toggle
  const headerHTML = `
    <div class="card-header">
      <h2 class="card-title">📚 Vocabulary</h2>
      <div class="vocab-mode-toggle">
        <button class="vocab-mode-btn" data-mode="list">List</button>
        <button class="vocab-mode-btn" data-mode="flashcard">Flashcards</button>
        <button class="vocab-mode-btn active" data-mode="kanban">Board</button>
      </div>
    </div>
  `;
  
  // Render Kanban board
  const kanbanHTML = this.renderer.renderKanbanBoard(groupedWords, this.storage);
  
  this.vocabularyContainer.innerHTML = headerHTML + kanbanHTML;
  
  // Attach listeners
  this.attachVocabularyListeners();
}
```

---

#### Step 6: Add NEW `setupKanbanListeners()` Method

**Add this NEW method after `renderKanbanMode()`:**

```javascript
/**
 * ✨ NEW: Setup Kanban controller and event listeners
 */
setupKanbanListeners() {
  const kanbanContainer = this.vocabularyContainer.querySelector('.vocab-kanban-container');
  
  if (!kanbanContainer) {
    console.warn('[LessonEngine] Kanban container not found');
    return;
  }
  
  // Initialize controller (lazy)
  if (!this.kanbanController) {
    this.kanbanController = new KanbanController(this.eventBus);
    
    // Subscribe to Kanban events
    this.eventBus.on('kanban:word-moved', (data) => this.handleKanbanWordMoved(data));
    this.eventBus.on('kanban:audio-requested', (data) => this.handleKanbanAudio(data));
    this.eventBus.on('kanban:reset-requested', () => this.handleKanbanReset());
  }
  
  // Attach drag-and-drop listeners
  this.kanbanController.attach(kanbanContainer);
  
  console.log('[LessonEngine] Kanban listeners attached');
}
```

---

#### Step 7: Add NEW Event Handler Methods

**Add these NEW methods after `setupKanbanListeners()`:**

```javascript
/**
 * ✨ NEW: Handle word moved between Kanban columns
 * @param {Object} data - { word, oldStatus, newStatus, isQuickMove, dragDuration }
 */
handleKanbanWordMoved(data) {
  const { word, oldStatus, newStatus } = data;
  
  console.log(`[LessonEngine] Moving word: ${word} from ${oldStatus} to ${newStatus}`);
  
  // Update storage
  this.storage.updateWordStatus(word, newStatus);
  
  // Show notification
  const statusLabels = {
    'to-learn': 'To Learn',
    'learning': 'Learning',
    'known': 'Known',
    'favorites': 'Favorites'
  };
  
  this.showNotification(`"${word}" moved to ${statusLabels[newStatus]}`, 'success');
  
  // Re-render Kanban board
  this.renderKanbanMode();
}

/**
 * ✨ NEW: Handle audio button click in Kanban card
 * @param {Object} data - { word }
 */
handleKanbanAudio(data) {
  const { word } = data;
  console.log(`[LessonEngine] Playing audio: ${word}`);
  this.tts.speak(word, 'en');
}

/**
 * ✨ NEW: Handle reset button click in Kanban board
 */
handleKanbanReset() {
  console.log('[LessonEngine] Resetting Kanban board');
  
  // Clear all word statuses
  this.storage.clearAllStatuses();
  
  // Show notification
  this.showNotification('All words reset to "To Learn"', 'info');
  
  // Re-render
  this.renderKanbanMode();
}
```

---

#### Step 8: Add Notification Helper (if not exists)

**Check if `showNotification()` exists. If NOT, add this method:**

```javascript
/**
 * Show notification to user
 * @param {string} message - Notification message
 * @param {string} type - 'success', 'error', 'info', 'warning'
 */
showNotification(message, type = 'info') {
  // Simple notification implementation
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: var(--card-bg);
    color: var(--text-main);
    padding: 12px 20px;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-xl);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
```

**Add CSS animations to `lesson-styles.css`:**

```css
@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(400px);
    opacity: 0;
  }
}
```

---

## 🧪 Testing Checklist

### Basic Functionality

- [ ] Kanban board renders correctly with 4 columns
- [ ] Words appear in "To Learn" column by default
- [ ] Drag-and-drop works between columns
- [ ] Quick move button (→) moves word to next stage
- [ ] Audio button plays pronunciation
- [ ] Reset button clears all progress (with confirmation)
- [ ] Mode toggle switches between List/Flashcard/Board

### Data Persistence

- [ ] Word status saved to localStorage
- [ ] Status persists after page reload
- [ ] Status synced across lesson views

### Edge Cases

- [ ] Empty vocabulary handled gracefully
- [ ] Dragging to same column does nothing
- [ ] Multiple rapid drags don't break state
- [ ] Works on mobile (touch events)

### Performance

- [ ] No lag when dragging cards
- [ ] Re-render after move is smooth
- [ ] No memory leaks (check DevTools)

### Accessibility

- [ ] Keyboard navigation works
- [ ] Screen reader announces status changes
- [ ] Focus states visible

---

## 🐛 Debugging Tips

### Check Console Logs

```javascript
// You should see these logs:
[KanbanController] Attached to container
[LessonEngine] Moving word: test from to-learn to learning
[KanbanController] Word "test" moved: to-learn → learning
```

### Inspect localStorage

```javascript
// In browser console:
console.log(localStorage.getItem('vocab_word_statuses'));

// Should show:
{"test": "learning", "example": "known"}
```

### Check Event Bus

```javascript
// In browser console (after lessonEngine is loaded):
window.lessonEngine.eventBus.listeners;

// Should show registered events:
// Map(3) { 'kanban:word-moved' => Set(1), ... }
```

---

## 🔄 Rollback Plan

If something breaks, follow these steps:

### 1. Remove Kanban Mode from UI

```javascript
// In lesson-engine.js constructor:
this.vocabMode = 'list'; // Remove 'kanban' option

// In renderVocabularySection():
// Comment out Kanban code:
// if (this.vocabMode === 'kanban') { ... }
```

### 2. Remove Script Tags from HTML

```html
<!-- Comment out in lesson.html -->
<!-- <link rel="stylesheet" href="assets/css/vocabulary-kanban.css"> -->
<!-- <script src="assets/js/vocabulary-kanban.js"></script> -->
```

### 3. System Still Works

- List mode works ✅
- Flashcard mode works ✅
- Reading/Grammar/Quiz work ✅
- No errors in console ✅

---

## 📊 Success Metrics

### After Stage 3 is complete:

1. **User can switch to Kanban mode** - Click "Board" button
2. **Drag-and-drop works smoothly** - Move cards between columns
3. **Progress persists** - Reload page, status remains
4. **No performance issues** - Smooth animations, no lag
5. **Works on mobile** - Touch gestures work

---

## 🚀 Next Steps After Stage 3

### Future Enhancements (Optional)

1. **Statistics Dashboard** - Show progress charts
2. **Filters** - Filter by part of speech, difficulty
3. **Sorting** - Sort cards alphabetically, by date added
4. **Bulk Actions** - Move multiple cards at once
5. **Custom Columns** - User-defined stages
6. **Export Progress** - Download vocabulary progress as CSV

---

## ❓ FAQ

### Q: Why event bus instead of direct method calls?

**A:** Event bus decouples KanbanController from LessonEngine, making code more testable and maintainable.

### Q: Why lazy initialization of KanbanController?

**A:** Saves memory - controller only created when user enters Kanban mode.

### Q: Can I use Kanban mode without LessonStorage?

**A:** No, Kanban mode requires `getWordsByStatus()` and `updateWordStatus()` from LessonStorage.

### Q: Does Kanban work with existing saved words?

**A:** Yes! Existing saved words start in "To Learn" column by default.

---

## 📝 Summary

### Changes Required:

1. ✅ Add 2 script tags to `lesson.html`
2. ✅ Update `LessonEngine` constructor (add eventBus, kanbanController)
3. ✅ Update 3 existing methods (switchVocabMode, renderVocabularySection, attachVocabularyListeners)
4. ✅ Add 5 new methods (renderKanbanMode, setupKanbanListeners, 3 event handlers)
5. ✅ Add showNotification helper (if not exists)

### Total Lines of Code: ~150 lines

### Estimated Time: 30-45 minutes

---

**Ready to implement? Let me know and I'll create a pull-ready version!** 🚀