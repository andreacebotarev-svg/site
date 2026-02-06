/**
 * LESSON ENGINE
 * Main application controller
 */

// ✨ DEBUG HELPER - Conditional logging for development
const DEBUG = window.location.hostname === 'localhost' || 
              window.location.hostname === '127.0.0.1' ||
              window.DEBUG_MODE === true;
const debug = (...args) => DEBUG && console.log('[LessonEngine]', ...args);

class LessonEngine {
  constructor(lessonId) {
    this.lessonId = lessonId;
    this.storage = new LessonStorage(lessonId);
    this.tts = new LessonTTS();
    this.themeManager = new ThemeManager(); // ✨ NEW: Theme manager instance
    this.lessonData = null;
    this.currentTab = 'reading';
    this.vocabMode = 'list'; // 'list', 'flashcard', 'kanban' ✨ NEW
    this.flashcardIndex = 0;
    this.myWords = [];
    this.quizState = {
      currentQuestionIndex: 0,
      answers: [],
      completed: false
    };
    
    // ✨ NEW: Event bus for Kanban communication
    this.eventBus = new SimpleEventBus();
    
    // ✨ NEW: Kanban controller (lazy initialized)
    this.kanbanController = null;

    // ✨ NEW: Audio playback state for Kids theme
    this.isAudioPlaying = false;
    this.audioSequencePromise = null;

    // Expose debugger helpers for console usage only
    window.debugPopup = {
      inspect: (word) => this.debugInspectPopup(word),
      highlight: (word) => this.debugHighlightPopup(word),
      panel: (word) => this.debugPanel(word)
    };
  }

  /**
   * Initialize the lesson
   */
  async init() {
    try {
      await this.loadLessonData();
      this.myWords = this.storage.loadWords();
      this.render();
      this.hideLoader();
      this.injectPopupStyles();
      // ThemeSwitcher is now handled by ThemeManager singleton
      
      // ✨ IMPROVED: Initialize audio buttons after render using double RAF
      // This ensures DOM is ready and CSS is applied before button update
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.updateAudioButtons();
        });
      });
    } catch (error) {
      console.error('Initialization error:', error);
      this.showError(error.message);
    }
  }

  /**
   * DEPRECATED: Theme switcher is now injected by ThemeManager
   */
  injectThemeSwitcher() {
    // Left empty to prevent interference with ThemeManager's fixed header
    console.log('[LessonEngine] Skipping legacy theme injection (handled by ThemeManager)');
  }

  /**
   * ✨ NEW: Centralized method to get current theme
   * @returns {string} Current theme ID ('default', 'kids', 'dark')
   */
  getCurrentTheme() {
    if (document.documentElement.classList.contains('theme-kids')) return 'kids';
    if (document.documentElement.classList.contains('theme-dark')) return 'dark';
    return 'default';
  }

  /**
   * DEPRECATED: Theme switching is handled by ThemeManager internally
   * Kept for backward compatibility if called from console
   * ✨ IMPROVED: Only updates buttons, doesn't re-render entire tab
   * @param {string} themeId - Theme ID ('default', 'kids', 'dark')
   */
  handleThemeSwitch(themeId) {
    this.themeManager.setTheme(themeId);
    
    // ✨ IMPROVED: Double RAF for reliable CSS update, then update only buttons
    // This preserves scroll position and other UI state
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.updateAudioButtons();
      });
    });
  }

  /**
   * Inject critical popup styles into document
   */
  injectPopupStyles() {
    if (document.getElementById('popup-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'popup-styles';
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      .word-popup {
        position: fixed;
        z-index: 10000;
        background: white;
        border: 1px solid rgba(0,0,0,0.1);
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.1);
        min-width: 280px;
        max-width: 350px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        color: #1a1a1a;
        animation: fadeIn 0.2s ease-out;
      }
      .word-popup-content {
        display: flex;
        flex-direction: column;
      }
      .word-popup-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid #eee;
      }
      .word-popup-word {
        font-weight: 600;
        font-size: 16px;
        color: #1a1a1a !important;
      }
      .word-popup-close {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #666 !important;
        padding: 4px 8px;
        line-height: 1;
        transition: color 0.2s;
      }
      .word-popup-close:hover {
        color: #000 !important;
      }
      .word-popup-body {
        padding: 16px;
      }
      .word-popup-phonetic {
        color: #666 !important;
        font-size: 13px;
        margin-bottom: 8px;
        font-style: italic;
      }
      .word-popup-translation {
        font-size: 15px;
        margin-bottom: 12px;
        color: #1a1a1a !important;
      }
      .word-popup-error {
        color: #d73a49 !important;
        font-size: 14px;
        margin-bottom: 12px;
      }
      .word-popup-actions {
        display: flex;
        gap: 8px;
      }
      .word-popup-btn {
        flex: 1;
        padding: 8px 16px;
        border: 1px solid #ddd;
        border-radius: 6px;
        background: white;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.2s;
        white-space: nowrap;
        color: #1a1a1a;
      }
      .word-popup-btn:hover {
        background: #f5f5f5;
        border-color: #ccc;
      }
      .word-popup-btn:active {
        transform: scale(0.98);
      }
      .word-popup-btn.primary {
        background: #0969da;
        color: white !important;
        border-color: #0969da;
      }
      .word-popup-btn.primary:hover {
        background: #0860ca;
        border-color: #0860ca;
      }
      .word-popup-btn.saved {
        background: #1a7f37;
        color: white !important;
        border-color: #1a7f37;
      }
      .word-popup-btn.saved:hover {
        background: #1a7038;
        border-color: #1a7038;
      }
      .word-popup-loader {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #666 !important;
        font-size: 14px;
      }
      .word-popup .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid #eee;
        border-top-color: #0969da;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      
      /* Saved words highlighting */
      .word-saved {
        background: rgba(26, 127, 55, 0.15) !important;
        border-bottom: 2px solid #1a7f37;
        font-weight: 500;
      }
      .word-saved:hover {
        background: rgba(26, 127, 55, 0.25) !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Non-intrusive popup debugger helpers (console only)
   */
  debugInspectPopup(word) {
    const popup = document.getElementById('word-popup');
    if (!popup) {
      console.warn('debugInspectPopup: no popup in DOM. Click a word first.');
      return;
    }

    const style = window.getComputedStyle(popup);
    const rect = popup.getBoundingClientRect();

    console.group('🐛 POPUP INSPECT');
    console.log('Word:', word);
    console.log('Computed styles:', {
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      position: style.position,
      zIndex: style.zIndex,
      top: style.top,
      left: style.left,
      width: style.width,
      height: style.height,
      background: style.backgroundColor,
      color: style.color
    });
    console.log('Bounding box:', {
      top: rect.top,
      left: rect.left,
      bottom: rect.bottom,
      right: rect.right,
      inViewport:
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.right <= window.innerWidth
    });

    // Parent overflow & stacking contexts
    let parent = popup.parentElement;
    const overflowIssues = [];
    while (parent && parent !== document.body) {
      const ps = window.getComputedStyle(parent);
      if (
        ps.overflow !== 'visible' ||
        ps.overflowX !== 'visible' ||
        ps.overflowY !== 'visible'
      ) {
        overflowIssues.push({
          tag: parent.tagName,
          className: parent.className,
          overflow: ps.overflow,
          overflowX: ps.overflowX,
          overflowY: ps.overflowY
        });
      }
      parent = parent.parentElement;
    }

    if (overflowIssues.length) {
      console.warn('🚨 Overflow ancestors:', overflowIssues);
    } else {
      console.log('No overflow clipping detected.');
    }

    console.groupEnd();
  }

  debugHighlightPopup(word) {
    const popup = document.getElementById('word-popup');
    if (!popup) {
      console.warn('debugHighlightPopup: no popup in DOM. Click a word first.');
      return;
    }

    popup.dataset.__debugOldStyle = popup.getAttribute('style') || '';
    popup.style.outline = '4px solid red';
    popup.style.background = 'rgba(255,0,0,0.1)';
    popup.style.zIndex = '999999';

    console.log('Popup highlighted for word:', word);
  }

  debugPanel(word) {
    const popup = document.getElementById('word-popup');
    if (!popup) {
      console.warn('debugPanel: no popup in DOM. Click a word first.');
      return;
    }

    const existing = document.getElementById('popup-debug-panel');
    if (existing) existing.remove();

    const rect = popup.getBoundingClientRect();
    const style = window.getComputedStyle(popup);

    const panel = document.createElement('div');
    panel.id = 'popup-debug-panel';
    panel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 360px;
      max-height: 80vh;
      background: #1e1e1e;
      color: #d4d4d4;
      font-family: Consolas, monospace;
      font-size: 12px;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      z-index: 1000000;
      overflow-y: auto;
    `;

    panel.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px; color: #4ec9b0;">
        🐛 Popup Debugger
      </div>
      <div style="margin-bottom: 4px;">
        <span style="color: #9cdcfe;">Word:</span>
        <span>${word}</span>
      </div>
      <div style="margin-bottom: 4px;">
        <span style="color: #9cdcfe;">Position:</span>
        <span>top: ${rect.top.toFixed(1)}px, left: ${rect.left.toFixed(1)}px</span>
      </div>
      <div style="margin-bottom: 4px;">
        <span style="color: #9cdcfe;">Size:</span>
        <span>${rect.width.toFixed(1)} × ${rect.height.toFixed(1)} px</span>
      </div>
      <div style="margin-bottom: 4px;">
        <span style="color: #9cdcfe;">Z-index:</span>
        <span>${style.zIndex}</span>
      </div>
      <div style="margin-bottom: 4px;">
        <span style="color: #9cdcfe;">Visibility:</span>
        <span>opacity: ${style.opacity}, display: ${style.display}</span>
      </div>
      <div style="margin: 8px 0; border-top: 1px solid #333;"></div>
      <button id="popup-debug-center" style="width: 100%; padding: 6px; margin-bottom: 4px; cursor: pointer;">
        📍 Move popup to center
      </button>
      <button id="popup-debug-red" style="width: 100%; padding: 6px; margin-bottom: 4px; cursor: pointer;">
        🔴 Paint popup red
      </button>
      <button id="popup-debug-close" style="width: 100%; padding: 6px; cursor: pointer;">
        ✕ Close panel
      </button>
    `;

    document.body.appendChild(panel);

    document.getElementById('popup-debug-center').onclick = () => {
      popup.style.top = '50%';
      popup.style.left = '50%';
      popup.style.transform = 'translate(-50%, -50%)';
      popup.style.zIndex = '999999';
    };

    document.getElementById('popup-debug-red').onclick = () => {
      popup.style.background = 'red';
      popup.style.color = 'white';
      popup.style.border = '4px solid yellow';
      popup.style.zIndex = '999999';
    };

    document.getElementById('popup-debug-close').onclick = () => {
      panel.remove();
    };
  }

  /**
   * Load lesson JSON data
   */
  async loadLessonData() {
    // Add cache-busting parameter
    const cacheBust = Date.now();
    const response = await fetch(`../data/${this.lessonId}.json?v=${cacheBust}`);

    if (!response.ok) {
      throw new Error(`Failed to load lesson data: ${response.status}`);
    }

    this.lessonData = await response.json();
    this.renderer = new LessonRenderer(this.lessonData, this.tts, this.storage, this.themeManager);
  }

  /**
   * Hide loader
   */
  hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
      setTimeout(() => {
        loader.classList.add('hidden');
      }, 400);
    }
  }

  /**
   * Show error
   */
  showError(message) {
    const loader = document.getElementById('loader');
    if (loader) {
      loader.innerHTML = `
        <div style="text-align: center; color: var(--accent-danger);">
          <div style="font-size: 2rem; margin-bottom: 12px;">⚠️</div>
          <div style="font-size: 0.95rem; margin-bottom: 8px;">Failed to load lesson</div>
          <div style="font-size: 0.8rem; color: var(--text-soft);">${message}</div>
        </div>
      `;
    }
  }

  /**
   * Full render of the app
   */
  render() {
    this.renderInterface();
    this.renderCurrentTab();
    this.updateSavedWordsCount();
  }

  /**
   * Render main interface structure (NO SIDEBAR)
   * ✨ FIXED: Removed duplicate audio button from header
   */
  renderInterface() {
    const { title, subtitle, meta } = this.lessonData;
    const { level = 'A1', duration = 30 } = meta || {};
    
    const hasGrammar = this.lessonData.grammar && Object.keys(this.lessonData.grammar).length > 0;

    const appEl = document.getElementById('app');
    appEl.innerHTML = `
      <div class="app-shell">
        <div class="app-main">
          <header class="lesson-header">
            <div class="lesson-header-main">
              <div class="lesson-kicker">English Lesson</div>
              <h1 class="lesson-title">${this.renderer.escapeHTML(title)}</h1>
              <p class="lesson-subtitle">${this.renderer.escapeHTML(subtitle)}</p>
              <div class="lesson-meta">
                <span class="pill"><strong>${this.renderer.escapeHTML(level)}</strong></span>
                <span class="pill">⏱ <strong>${duration} min</strong></span>
                <span class="pill">📘 Lesson ${this.renderer.escapeHTML(this.lessonId)}</span>
              </div>
            </div>
            <div class="lesson-actions">
              <!-- ✅ FIXED: Removed duplicate audio button - audio controls now only in reading-controls-left -->
              <div class="lesson-progress">
                <div class="progress-bar">
                  <div class="progress-bar-fill"></div>
                </div>
                <span class="progress-label">35%</span>
              </div>
            </div>
          </header>

          <div class="tabs">
            <button class="tab ${this.currentTab === 'reading' ? 'active' : ''}" data-tab="reading" onclick="window.lessonEngine.switchTab('reading')">
              Reading
            </button>
            <button class="tab ${this.currentTab === 'vocabulary' ? 'active' : ''}" data-tab="vocabulary" onclick="window.lessonEngine.switchTab('vocabulary')">
              Vocabulary
            </button>
            ${hasGrammar ? `
            <button class="tab ${this.currentTab === 'grammar' ? 'active' : ''}" data-tab="grammar" onclick="window.lessonEngine.switchTab('grammar')">
              Grammar
            </button>
            ` : ''}
            <button class="tab ${this.currentTab === 'mywords' ? 'active' : ''}" data-tab="mywords" onclick="window.lessonEngine.switchTab('mywords')">
              My Words (<span id="words-count-badge">0</span>)
            </button>
          </div>

          <div class="card">
            <div class="card-inner" id="tab-content">
              <!-- Dynamic content -->
            </div>
          </div>
        </div>
      </div>
    `;

    // Initialize Magic Line animation AFTER DOM ready
    this.initTabAnimations();
  }

  /**
   * Magic Line Tab Animation Controller
   * Injects sliding indicator and binds geometry calculations
   */
  initTabAnimations() {
    const container = document.querySelector('.tabs');
    if (!container) return;

    // 1. Create indicator element if missing
    let indicator = container.querySelector('.tab-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'tab-indicator';
      container.appendChild(indicator);
    }

    // 2. Geometry calculation function (relative to parent)
    const moveIndicator = (targetBtn) => {
      if (!targetBtn) return;
      
      const width = targetBtn.offsetWidth;
      const left = targetBtn.offsetLeft;
      
      requestAnimationFrame(() => {
        indicator.style.width = `${width}px`;
        indicator.style.transform = `translateX(${left}px)`;
      });
    };

    // 3. Bind to ALL tab buttons (not just via onclick)
    const buttons = container.querySelectorAll('.tab');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        moveIndicator(e.currentTarget);
      });
    });

    // 4. Init position (zero-timeout to allow layout paint)
    const activeBtn = container.querySelector('.tab.active') || buttons[0];
    setTimeout(() => moveIndicator(activeBtn), 0);

    // 5. Resize handler (responsive recalculation)
    const resizeObserver = new ResizeObserver(() => {
      const currentActive = container.querySelector('.tab.active');
      if (currentActive) moveIndicator(currentActive);
    });
    resizeObserver.observe(container);
  }

  /**
   * Show word popup with translation
   */
  async showWordPopup(word, event) {
    event.stopPropagation();
    
    // Remove old popup if exists
    const oldPopup = document.getElementById('word-popup');
    if (oldPopup) oldPopup.remove();
    
    // Create popup
    const popup = document.createElement('div');
    popup.id = 'word-popup';
    popup.className = 'word-popup';
    
    // Calculate position (viewport-relative for position:fixed)
    const rect = event.target.getBoundingClientRect();
    const popupHeight = 200;
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    
    let top, left;
    
    // Smart positioning: above if space, otherwise below
    if (spaceAbove >= popupHeight || spaceAbove > spaceBelow) {
      top = rect.top - popupHeight - 12;
    } else {
      top = rect.bottom + 8;
    }
    
    // Horizontal positioning with edge detection
    left = rect.left;
    const maxLeft = window.innerWidth - 350 - 20;
    if (left > maxLeft) left = maxLeft;
    if (left < 20) left = 20;
    
    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;
    
    popup.innerHTML = `
      <div class="word-popup-content">
        <div class="word-popup-header">
          <span class="word-popup-word">${word}</span>
          <button class="word-popup-close" onclick="this.closest('.word-popup').remove()">✕</button>
        </div>
        <div class="word-popup-body">
          <div class="word-popup-loader">
            <div class="spinner"></div>
            Loading translation...
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(popup);
    
    // Adjust position after render
    const actualHeight = popup.offsetHeight;
    if (spaceAbove >= actualHeight || spaceAbove > spaceBelow) {
      popup.style.top = `${rect.top - actualHeight - 12}px`;
    }
    
    // Get translation
    try {
      const translation = await this.translateWord(word);
      const isInVocab = this.isWordInVocabulary(word);
      
      let transcription = '';
      if (isInVocab) {
        const vocabWord = this.lessonData.vocabulary.words.find(
          w => w.en.toLowerCase() === word.toLowerCase()
        );
        transcription = vocabWord?.transcription || '';
      }
      
      popup.querySelector('.word-popup-body').innerHTML = `
        ${transcription ? `<div class="word-popup-phonetic">${transcription}</div>` : ''}
        <div class="word-popup-translation">${translation}</div>
        <div class="word-popup-actions">
          <button class="word-popup-btn primary" onclick="window.lessonEngine.speakWord('${word.replace(/'/g, "\\'")}')";>  
            🔊 Listen
          </button>
          <button class="word-popup-btn ${this.storage.isWordSaved(word) ? 'saved' : ''}" 
                  onclick="window.lessonEngine.toggleWordFromPopup('${word.replace(/'/g, "\\'")}', '${translation.replace(/'/g, "\\'")}}', this);">
            ${this.storage.isWordSaved(word) ? '✓ Saved' : '💾 Save'}
          </button>
        </div>
      `;
      
      // Final position adjustment
      const finalHeight = popup.offsetHeight;
      if (spaceAbove >= finalHeight || spaceAbove > spaceBelow) {
        popup.style.top = `${rect.top - finalHeight - 12}px`;
      }
      
    } catch (error) {
      console.error('Translation error:', error);
      popup.querySelector('.word-popup-body').innerHTML = `
        <div class="word-popup-error">
          ⚠️ Translation unavailable
        </div>
        <div class="word-popup-actions">
          <button class="word-popup-btn primary" onclick="window.lessonEngine.speakWord('${word.replace(/'/g, "\\'")}}');">
            🔊 Listen
          </button>
        </div>
      `;
    }
    
    // Close on click outside
    setTimeout(() => {
      document.addEventListener('click', function closePopup(e) {
        if (!popup.contains(e.target)) {
          popup.remove();
          document.removeEventListener('click', closePopup);
        }
      });
    }, 100);
  }

  /**
   * Translate word using Google Translate API
   */
  async translateWord(word) {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ru&dt=t&q=${encodeURIComponent(word)}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        return data[0][0][0];
      }
      
      throw new Error('Translation not found');
    } catch (error) {
      console.warn('Google Translate failed, trying fallback:', error);
      
      // Fallback: check if word is in vocabulary
      const vocabWord = this.lessonData.vocabulary?.words.find(
        w => w.en.toLowerCase() === word.toLowerCase()
      );
      
      if (vocabWord) {
        return vocabWord.ru;
      }
      
      throw new Error('Translation unavailable');
    }
  }

  /**
   * Check if word is in vocabulary
   */
  isWordInVocabulary(word) {
    if (!this.lessonData?.vocabulary?.words) return false;
    return this.lessonData.vocabulary.words.some(
      w => w.en.toLowerCase() === word.toLowerCase()
    );
  }

  /**
   * Toggle word from popup
   */
  toggleWordFromPopup(word, translation, button) {
    if (this.storage.isWordSaved(word)) {
      // Remove
      this.storage.removeWord(word);
      button.textContent = '💾 Save';
      button.classList.remove('saved');
      this.showNotification(`"${word}" removed from saved words`);
    } else {
      // Save
      this.storage.addWord({
        word: word,
        definition: translation,
        phonetic: '',
        timestamp: Date.now()
      });
      button.textContent = '✓ Saved';
      button.classList.add('saved');
      this.showNotification(`"${word}" saved!`);
    }
    
    // Update saved words count and re-render to update highlighting
    this.myWords = this.storage.loadWords();
    this.updateSavedWordsCount();
    this.renderCurrentTab();
  }

  /**
   * Update saved words count badge
   */
  updateSavedWordsCount() {
    const badge = document.getElementById('words-count-badge');
    if (badge) {
      const globalCount = this.storage.loadAllGlobalWords().length;
      badge.textContent = globalCount;
    }
  }

  /**
   * Switch tab
   */
  switchTab(tabName) {
    this.currentTab = tabName;
    
    // Update active class
    const buttons = document.querySelectorAll('.tab');
    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Move indicator to new active tab
    const activeBtn = document.querySelector('.tab.active');
    const indicator = document.querySelector('.tab-indicator');
    if (activeBtn && indicator) {
      const width = activeBtn.offsetWidth;
      const left = activeBtn.offsetLeft;
      
      requestAnimationFrame(() => {
        indicator.style.width = `${width}px`;
        indicator.style.transform = `translateX(${left}px)`;
      });
    }
    
    if (tabName === 'vocabulary' && this.vocabMode === 'flashcard') {
      this.flashcardIndex = Math.max(0, this.flashcardIndex);
    }
    
    this.renderCurrentTab();
    this.tts.vibrate(10);
  }

  /**
   * Render current tab content
   */
  renderCurrentTab() {
    const contentEl = document.getElementById('tab-content');
    if (!contentEl) return;

    let html = '';

    switch (this.currentTab) {
      case 'reading':
        html = this.renderer.renderReading(this.myWords);
        break;
      case 'vocabulary':
        html = this.renderer.renderVocabulary(this.vocabMode, this.myWords, this.flashcardIndex);
        break;
      case 'grammar':
        html = this.renderer.renderGrammar();
        break;
      case 'mywords':
        const allGlobalWords = this.storage.loadAllGlobalWords();
        html = this.renderMyWords(allGlobalWords);
        break;
    }

    contentEl.innerHTML = html;
    
    // Initialize theme switcher if it exists in the rendered content
    if (this.currentTab === 'reading') {
      const themeSwitcher = contentEl.querySelector('.theme-switcher');
      if (themeSwitcher && this.themeManager) {
        this.themeManager.initializeThemeSwitcher(themeSwitcher);
      }
      
      // Update audio buttons state after render
      this.updateAudioButtons();
    }
    
    this.attachCurrentTabListeners();
  }

  /**
   * Render My Words tab
   */
  renderMyWords(wordsList = null) {
    const displayWords = wordsList || this.myWords;
    
    if (displayWords.length === 0) {
      return `
        <div class="card-header">
          <h2 class="card-title">📚 My Words</h2>
        </div>
        <div style="padding: 40px 20px; text-align: center; color: var(--text-soft);">
          <div style="font-size: 3rem; margin-bottom: 16px;">📖</div>
          <p style="font-size: 1rem; margin-bottom: 8px;">No saved words yet</p>
          <p style="font-size: 0.85rem;">Click on any word in the reading to save it here!</p>
        </div>
      `;
    }

    const wordsHTML = displayWords.map(word => {
      const safeWord = this.renderer.escapeHTML(word.word).replace(/'/g, "\\'");
      return `
        <div class="vocab-item">
          <div class="vocab-top-line">
            <div>
              <span class="vocab-word">${this.renderer.escapeHTML(word.word)}</span>
              ${word.phonetic ? `<span class="vocab-phonetic">${this.renderer.escapeHTML(word.phonetic)}</span>` : ''}
            </div>
            <div style="display: flex; gap: 6px;">
              <button class="icon-btn primary" onclick="window.lessonEngine.speakWord('${safeWord}')" aria-label="Speak word">
                <span>🔊</span>
              </button>
              <button class="icon-btn danger" onclick="window.lessonEngine.removeWord('${safeWord}')" aria-label="Remove word">
                <span>❌</span>
              </button>
            </div>
          </div>
          <div class="vocab-definition">${this.renderer.escapeHTML(word.definition)}</div>
          <div style="font-size: 0.75rem; color: var(--text-soft); margin-top: 4px;">
            Saved ${new Date(word.timestamp || word.lastReviewed).toLocaleDateString()}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="card-header">
        <h2 class="card-title">📚 My Words</h2>
        <button class="primary-btn secondary" onclick="window.lessonEngine.clearAllWords()" aria-label="Clear all words">
          <span>🗑️</span> Clear All
        </button>
      </div>
      <div class="vocab-list" style="margin-top: var(--space-md);">
        ${wordsHTML}
      </div>
    `;
  }

  /**
   * Attach event listeners for current tab
   */
  attachCurrentTabListeners() {
    if (this.currentTab === 'vocabulary') {
      this.attachVocabularyListeners();
    }
  }

  /**
   * Attach listeners for vocabulary tab
   */
  attachVocabularyListeners() {
    const modeButtons = document.querySelectorAll('.vocab-mode-btn');
    modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchVocabMode(btn.dataset.mode);
      });
    });
    
    // ✨ NEW: Setup Kanban if in kanban mode
    if (this.vocabMode === 'kanban') {
      this.setupKanbanListeners();
    }
  }

  /**
   * ✨ FIXED: Switch vocabulary mode with proper cleanup and re-initialization
   */
  switchVocabMode(mode) {
    // Always cleanup Kanban when leaving
    if (this.vocabMode === 'kanban' && this.kanbanController) {
      this.kanbanController.detach();
      console.log('[LessonEngine] Detached Kanban controller');
    }
    
    // Update mode
    this.vocabMode = mode;
    
    if (mode === 'flashcard') {
      this.flashcardIndex = 0;
    }
    
    // Re-render
    this.renderCurrentTab();
    
    // Setup Kanban if entering kanban mode (no early return anymore!)
    if (mode === 'kanban') {
      this.setupKanbanListeners();
      console.log('[LessonEngine] Re-attached Kanban controller');
    }
  }

  /**
   * ✨ NEW: Setup Kanban controller and event listeners
   */
  setupKanbanListeners() {
    const kanbanContainer = document.querySelector('.vocab-kanban-container');
    
    if (!kanbanContainer) {
      console.warn('[LessonEngine] Kanban container not found');
      return;
    }
    
    // Initialize controller (lazy) - only once
    if (!this.kanbanController) {
      this.kanbanController = new KanbanController(this.eventBus);
      
      // Subscribe to Kanban events
      this.eventBus.on('kanban:word-moved', (data) => this.handleKanbanWordMoved(data));
      this.eventBus.on('kanban:audio-requested', (data) => this.handleKanbanAudio(data));
      this.eventBus.on('kanban:reset-requested', () => this.handleKanbanReset());
    }
    
    // Attach drag-and-drop listeners (can be called multiple times safely)
    this.kanbanController.attach(kanbanContainer);
    
    console.log('[LessonEngine] Kanban listeners attached');
  }

  /**
   * ✨ NEW: Handle word moved between Kanban columns
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
    
    this.showNotification(`"${word}" moved to ${statusLabels[newStatus]}`);
    
    // Re-render current tab (will re-render Kanban board)
    this.renderCurrentTab();
  }

  /**
   * ✨ NEW: Handle audio button click in Kanban card
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
    this.showNotification('All words reset to "To Learn"');
    
    // Re-render
    this.renderCurrentTab();
  }

  /**
   * Toggle word save/unsave
   */
  toggleWord(wordData) {
    const isSaved = this.storage.isWordSaved(wordData.word);

    if (isSaved) {
      this.storage.removeWord(wordData.word);
      this.showNotification(`Removed "${wordData.word}"`);
    } else {
      this.storage.addWord(wordData);
      this.showNotification(`Saved "${wordData.word}"`);
    }

    this.myWords = this.storage.loadWords();
    this.renderCurrentTab();
    this.updateSavedWordsCount();
    this.tts.vibrate(10);
  }

  /**
   * Toggle word from vocabulary panel
   */
  toggleWordFromVocab(word, definition, phonetic) {
    this.toggleWord({ word, definition, phonetic });
  }

  /**
   * Remove word
   */
  removeWord(word) {
    this.storage.removeWord(word);
    this.myWords = this.storage.loadWords();
    this.showNotification(`Removed "${word}"`);
    this.renderCurrentTab();
    this.updateSavedWordsCount();
  }

  /**
   * Clear all saved words
   */
  clearAllWords() {
    if (confirm('Are you sure you want to clear all saved words?')) {
      this.storage.clearAll();
      this.myWords = [];
      this.showNotification('All words cleared');
      this.renderCurrentTab();
      this.updateSavedWordsCount();
    }
  }

  /**
   * Speak all reading content
   */
  speakAllReading() {
    this.playAudio();
  }

  /**
   * ✨ NEW: Play audio for reading (with state tracking)
   */
  async playAudio() {
    const reading = this.lessonData.content?.reading;
    if (!reading) return;

    // If already playing, do nothing
    if (this.isAudioPlaying) return;

    this.isAudioPlaying = true;
    this.updateAudioButtons();

    const texts = reading.filter(p => p.type !== 'fact').map(para => para.text);
    
    try {
      // Start speaking sequence
      await this.tts.speakSequence(texts, 1500);
      // Audio finished successfully
      this.isAudioPlaying = false;
      this.updateAudioButtons();
    } catch (error) {
      // Error occurred
      console.warn('Audio playback error:', error);
      this.isAudioPlaying = false;
      this.updateAudioButtons();
    }

    // Also monitor synthesis state for manual stops
    const checkState = setInterval(() => {
      if (!this.tts.synthesis.speaking && this.isAudioPlaying) {
        this.isAudioPlaying = false;
        this.updateAudioButtons();
        clearInterval(checkState);
      }
    }, 100);

    // Cleanup after 5 minutes max
    setTimeout(() => {
      clearInterval(checkState);
      if (this.isAudioPlaying) {
        this.isAudioPlaying = false;
        this.updateAudioButtons();
      }
    }, 300000);
  }

  /**
   * ✨ NEW: Pause/stop audio playback
   */
  pauseAudio() {
    if (!this.isAudioPlaying) return;

    this.tts.stop();
    this.isAudioPlaying = false;
    this.updateAudioButtons();
  }

  /**
   * ✨ IMPROVED: Update audio button visibility based on playback state
   * Uses CSS classes instead of inline !important styles
   * Uses MutationObserver for reliable container detection
   * Includes ARIA attributes for accessibility
   */
  updateAudioButtons() {
    const readingControls = document.querySelector('.reading-controls-left');
    
    // ✨ IMPROVED: Use MutationObserver if container not found
    if (!readingControls) {
      this.observeAudioButtonsContainer();
      return;
    }
    
    const playBtn = readingControls.querySelector('.kids-audio-btn-play');
    const pauseBtn = readingControls.querySelector('.kids-audio-btn-pause');
    
    // Kids theme: Two separate buttons
    if (playBtn && pauseBtn) {
      // ✨ IMPROVED: Use CSS classes instead of inline styles with !important
      if (this.isAudioPlaying) {
        playBtn.classList.add('is-hidden');
        pauseBtn.classList.add('is-visible');
        
        // ✨ Accessibility: ARIA attributes
        playBtn.setAttribute('aria-hidden', 'true');
        pauseBtn.setAttribute('aria-hidden', 'false');
      } else {
        playBtn.classList.remove('is-hidden');
        pauseBtn.classList.remove('is-visible');
        
        // ✨ Accessibility: ARIA attributes
        playBtn.setAttribute('aria-hidden', 'false');
        pauseBtn.setAttribute('aria-hidden', 'true');
      }
      
      debug('Audio buttons updated', { 
        isPlaying: this.isAudioPlaying,
        playVisible: !this.isAudioPlaying,
        pauseVisible: this.isAudioPlaying
      });
      return;
    }
    
    // Other themes: Single button - update text
    if (playBtn) {
      playBtn.textContent = this.isAudioPlaying ? '⏸ Pause' : '🔊 Play audio';
      debug('Single audio button updated', { isPlaying: this.isAudioPlaying });
      return;
    }
    
    // Buttons not found
    debug('Audio buttons not found - Reading section might not be rendered');
  }

  /**
   * ✨ NEW: Observe DOM for audio buttons container appearance
   * Uses MutationObserver for reliable detection without race conditions
   */
  observeAudioButtonsContainer() {
    // Prevent multiple observers
    if (this._audioButtonsObserver) return;
    
    debug('Setting up MutationObserver for audio buttons container');
    
    this._audioButtonsObserver = new MutationObserver((mutations, obs) => {
      const controls = document.querySelector('.reading-controls-left');
      if (controls) {
        debug('Audio buttons container found via MutationObserver');
        obs.disconnect();
        this._audioButtonsObserver = null;
        this.updateAudioButtons();
      }
    });
    
    this._audioButtonsObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Cleanup after 10 seconds to prevent memory leaks
    setTimeout(() => {
      if (this._audioButtonsObserver) {
        debug('MutationObserver timeout - cleaning up');
        this._audioButtonsObserver.disconnect();
        this._audioButtonsObserver = null;
      }
    }, 10000);
  }

  /**
   * Speak a word
   */
  speakWord(word) {
    this.tts.speak(word);
  }

  /**
   * Flashcard navigation
   */
  flipFlashcard() {
    const card = document.getElementById('flashcard');
    if (card) {
      card.classList.toggle('flipped');
      this.tts.vibrate(15);
    }
  }

  nextFlashcard() {
    if (!this.lessonData.vocabulary?.words) return;
    
    const maxIndex = this.lessonData.vocabulary.words.length - 1;
    if (this.flashcardIndex < maxIndex) {
      this.flashcardIndex++;
    } else {
      this.flashcardIndex = 0;
    }
    
    this.renderCurrentTab();
    this.tts.vibrate(10);
  }

  prevFlashcard() {
    if (!this.lessonData.vocabulary?.words) return;
    
    if (this.flashcardIndex > 0) {
      this.flashcardIndex--;
    } else {
      this.flashcardIndex = this.lessonData.vocabulary.words.length - 1;
    }
    
    this.renderCurrentTab();
    this.tts.vibrate(10);
  }

  /**
   * ✨ NEW: Quiz methods for Reading tab
   */
  
  /**
   * Select answer in reading quiz
   * @param {number} answerIndex - Index of selected option
   */
  selectReadingQuizAnswer(answerIndex) {
    const quiz = this.lessonData.quiz;
    const questions = Array.isArray(quiz) ? quiz : (quiz.questions || []);
    
    if (questions.length === 0) return;
    
    const question = questions[this.quizState.currentQuestionIndex];
    const isCorrect = answerIndex === question.correct || answerIndex === question.correct_alt;

    console.log(`[Quiz] Answer selected: ${answerIndex}, correct: ${isCorrect}`);
    console.log('[Quiz] Current theme:', document.documentElement.getAttribute('data-theme') || 'default');

    this.quizState.answers[this.quizState.currentQuestionIndex] = {
      questionIndex: this.quizState.currentQuestionIndex,
      answerIndex,
      correct: isCorrect
    };

    // Re-render reading tab to show feedback
    this.renderCurrentTab();
    
    // Double-check DOM update
    requestAnimationFrame(() => {
      const buttons = document.querySelectorAll('.quiz-option');
      console.log('[Quiz] Buttons after render:', Array.from(buttons).map(b => `${b.textContent.trim()}: ${b.className}`));
    });

    this.tts.vibrate(isCorrect ? 30 : 50);
  }

  /**
   * Move to next question in reading quiz
   */
  nextReadingQuizQuestion() {
    const quiz = this.lessonData.quiz;
    const questions = Array.isArray(quiz) ? quiz : (quiz.questions || []);
    
    if (this.quizState.currentQuestionIndex < questions.length - 1) {
      this.quizState.currentQuestionIndex++;
    } else {
      this.quizState.completed = true;
    }
    
    this.renderCurrentTab();
    
    // Smooth scroll to quiz section
    setTimeout(() => {
      const quizSection = document.getElementById('reading-quiz');
      if (quizSection) {
        quizSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  /**
   * Reset quiz
   */
  resetQuiz() {
    this.quizState = {
      currentQuestionIndex: 0,
      answers: [],
      completed: false
    };
    
    // If in reading tab, stay there and scroll to quiz
    if (this.currentTab === 'reading') {
      this.renderCurrentTab();
      setTimeout(() => {
        const quizSection = document.getElementById('reading-quiz');
        if (quizSection) {
          quizSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    } else {
      this.renderCurrentTab();
    }
  }

  /**
   * Show notification
   */
  showNotification(message) {
    const notif = document.getElementById('notification');
    const textEl = document.getElementById('notification-text');

    if (notif && textEl) {
      textEl.textContent = message;
      notif.classList.add('visible');

      setTimeout(() => {
        notif.classList.remove('visible');
      }, 2500);
    }
  }
}