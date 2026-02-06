/**
 * WordPopover Component - Interactive word popup
 * Shows pronunciation, translation, and vocabulary options
 * Clean UI component that delegates data operations to services
 */

import { settingsManager } from '../../settings/settings-manager.js';
import { WordService } from '../../services/WordService.js';
import { TTSService } from '../../services/TTSService.js';
import { contextTranslationService } from '../../services/context-translation-service.js';
import { ContextExtractor } from '../../utils/context-extractor.js';

export class WordPopover {
  constructor(container, options = {}) {
    this.container = container;
    this.vocabularyStorage = options.vocabularyStorage; // Сохраняем ссылку
    this.activeWord = null;
    this.popover = null;
    this.useAPIs = options.useAPIs !== false; // Default to true, can be disabled for testing

    // Cache for "gluing" translations immediately when API returns
    this.wordDataCacheKey = 'reader_worddata_cache_v1';

    // Initialize services
    this.wordService = new WordService();
    this.ttsService = new TTSService();

    // Event handlers storage for cleanup
    this.boundHandlers = {};

    this.init();

    // Expose diagnostic functions globally
    this.setupDiagnostics();
  }

  setupDiagnostics() {
    if (typeof window !== 'undefined') {
      // Expose instance for debugging
      window.wordPopoverInstance = this;

      // Simple diagnostic function
      window.diagnosePopover = () => {
        console.log('=== WORD POPOVER DIAGNOSTIC ===');
        console.log('Active word:', this.activeWord?.textContent);
        console.log('Popover visible:', this.popover?.classList.contains('visible'));
        console.log('Services initialized:', {
          wordService: !!this.wordService,
          ttsService: !!this.ttsService
        });
        console.log('API enabled:', this.useAPIs);
        console.log('================================');
      };
    }
  }

  init() {
    // Create popover element
    this.popover = document.createElement('div');
    this.popover.className = 'word-popover';
    this.popover.setAttribute('role', 'dialog');
    this.popover.setAttribute('aria-modal', 'false');
    this.popover.innerHTML = `
      <div class="word-popover-content">
        <div class="word-header">
          <div class="word-text"></div>
          <button class="word-close" aria-label="Close">&times;</button>
        </div>
        <div class="word-pronunciation"></div>
        <div class="word-translation"></div>
        <div class="word-definition" style="display: none;"></div>
        <div class="word-context" style="display: none;">
          <div class="context-header">
            <span class="context-label">Контекст:</span>
          </div>
          <div class="context-source"></div>
          <div class="context-translation"></div>
        </div>
        <div class="word-actions">
          <button class="word-play-audio btn-icon" aria-label="Play pronunciation">🔊</button>
          <button class="word-add-vocab btn-secondary">Добавить в словарь</button>
          <button class="word-view-flashcards btn-ghost">К flashcards</button>
        </div>
      </div>
      <div class="word-popover-arrow"></div>
    `;

    this.container.appendChild(this.popover);
    this.attachEvents();
    this.hide(); // Start hidden
  }

  attachEvents() {
    // Close button
    this.popover.querySelector('.word-close').addEventListener('click', () => {
      this.hide();
    });

    // Audio play button
    this.popover.querySelector('.word-play-audio').addEventListener('click', () => {
      this.playAudio();
    });

    // Add to vocabulary
    this.popover.querySelector('.word-add-vocab').addEventListener('click', () => {
      this.addToVocabulary();
    });

    // View in flashcards
    this.popover.querySelector('.word-view-flashcards').addEventListener('click', () => {
      this.viewInFlashcards();
    });

    // ✅ FIX: Click outside to close (store reference for cleanup)
    this.boundHandlers.clickOutside = (e) => {
      if (!this.popover.contains(e.target) && this.activeWord && !this.activeWord.contains(e.target)) {
        this.hide();
      }
    };
    document.addEventListener('click', this.boundHandlers.clickOutside);

    // ✅ FIX: Escape key to close (store reference for cleanup)
    this.boundHandlers.escapeKey = (e) => {
      if (e.key === 'Escape' && this.popover.style.display !== 'none') {
        this.hide();
      }
    };
    document.addEventListener('keydown', this.boundHandlers.escapeKey);
  }

  _loadWordDataCache() {
    try {
      const raw = localStorage.getItem(this.wordDataCacheKey);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  _saveWordDataCache(cache) {
    try {
      localStorage.setItem(this.wordDataCacheKey, JSON.stringify(cache));
    } catch (e) {
      // ignore quota errors
    }
  }

  _cacheWordData(wordText, data) {
    if (!wordText || !data) return;

    const cache = this._loadWordDataCache();
    cache[wordText.toLowerCase().trim()] = {
      translation: data.translation || '',
      pronunciation: data.pronunciation || '',
      updatedAt: Date.now()
    };
    this._saveWordDataCache(cache);

    // "Glue" translation to existing vocabulary entry as soon as API returns
    if (this.vocabularyStorage && typeof this.vocabularyStorage.updateWordByText === 'function') {
      try {
        this.vocabularyStorage.updateWordByText(wordText, {
          translation: data.translation,
          phonetic: data.pronunciation
        });
      } catch (e) {
        console.warn('Failed to update vocabulary word data from API:', e);
      }
    }
  }

  _getCachedWordData(wordText) {
    if (!wordText) return null;
    const cache = this._loadWordDataCache();
    return cache[wordText.toLowerCase().trim()] || null;
  }

  async show(wordElement, rect, textContent, context = null) {
    if (!wordElement || !rect) {
      console.error('WordPopover.show: Missing required parameters', { wordElement, rect });
      return;
    }

    // Set active word
    this.activeWord = wordElement;
    const wordText = textContent || wordElement.textContent.trim();

    console.log(`WordPopover.show called for "${wordText}"`);

    // Show popover immediately with loading state
    this.showLoadingPopover(wordText, rect, context);

    // 🔥 TRUE AUTO-PLAY: If setting is enabled, play audio when popover opens
    if (settingsManager.get('autoPlayAudio')) {
      // Short delay to allow UI to render first
      setTimeout(() => this.playAudio(), 300);
    }

    if (!this.useAPIs) {
      console.log('Using offline mode for word:', wordText);
      const contextObj = context && typeof context === 'string' ? { sentence: context } : context;
      this.updatePopoverContent(wordText, `/${wordText}/`, 'Перевод недоступен (оффлайн)', null, contextObj);
      return;
    }

    // Generate unique ID for this request
    const requestId = Date.now();
    this.currentRequestId = requestId;

    try {
      // Get word data from service (handles all API calls internally)
      const data = await this.wordService.getWordData(wordText);

      // 🛑 Race Condition Check: If new request started, ignore this result
      if (this.currentRequestId !== requestId) {
        console.log(`Ignoring stale response for "${wordText}"`);
        return;
      }

      // Persist translation immediately when API returns
      this._cacheWordData(wordText, data);

      // Update content with loaded data
      const contextObj = context && typeof context === 'string' ? { sentence: context } : context;
      this.updatePopoverContent(wordText, data.pronunciation, data.translation, data.definition, contextObj);

      // 🔥 FIX: Trigger context translation asynchronously after word data is loaded
      if (contextObj?.sentence) {
        await this.updateContextContent(contextObj, null); // null to trigger API call
      }

    } catch (error) {
      if (this.currentRequestId !== requestId) return; // Ignore errors for stale requests

      if (error.name === 'AbortError') {
        console.log(`Request for "${wordText}" was cancelled`);
        return; // Request was cancelled, don't show error
      }

      console.error(`Failed to load word data for "${wordText}":`, error);
      this.showErrorPopover(wordText, rect);
    }
  }

  /**
   * Show a toast notification
   * @param {string} message - Message to show
   * @param {string} type - Toast type (success, error, info)
   */
  showToast(message, type = 'info') {
    // Try to use the toast manager if available, otherwise fallback to console
    if (window.toastManager) {
      window.toastManager[type](message);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  showLoadingPopover(wordText, rect, context = null) {
    console.log('Showing loading popover for:', wordText);

    // Update content with loading state
    const wordTextEl = this.popover.querySelector('.word-text');
    const pronunciationEl = this.popover.querySelector('.word-pronunciation');
    const translationEl = this.popover.querySelector('.word-translation');

    if (wordTextEl) wordTextEl.textContent = wordText;
    if (pronunciationEl) pronunciationEl.innerHTML = '<span style="opacity: 0.6;">Загрузка...</span>';

    // If we have cached translation, show it immediately (better UX) while API loads
    const cached = this._getCachedWordData(wordText);
    if (translationEl) {
      if (cached?.translation) {
        translationEl.textContent = cached.translation;
      } else {
        translationEl.innerHTML = '<span style="opacity: 0.6;">Загрузка перевода...</span>';
      }
    }

    // Hide definition initially
    const definitionEl = this.popover.querySelector('.word-definition');
    if (definitionEl) definitionEl.style.display = 'none';

    // Position and show popover
    this.positionPopover(rect);

    // Ensure popover is properly styled for visibility (force override)
    this.popover.style.position = 'fixed'; // Force fixed positioning
    this.popover.style.display = 'block';
    this.popover.style.zIndex = '10000'; // High z-index for visibility

    console.log('Popover display set to block, adding visible class...');

    requestAnimationFrame(() => {
      this.popover.classList.add('visible');
      console.log('Visible class added to popover');

      // Show context immediately if available
      if (context) {
        const contextObj = typeof context === 'string' ? { sentence: context } : context;
        this.updateContextContent(contextObj, null);
      }

      // Debug: Verify popover is visible after animation
      setTimeout(() => {
        const finalRect = this.popover.getBoundingClientRect();
        const computedStyle = getComputedStyle(this.popover);
        const isVisible = computedStyle.display !== 'none' &&
                         computedStyle.visibility !== 'hidden' &&
                         parseFloat(computedStyle.opacity) > 0;

        console.log('Popover visibility check:', {
          isVisible,
          display: computedStyle.display,
          visibility: computedStyle.visibility,
          opacity: computedStyle.opacity,
          inViewport: finalRect.bottom > 0 && finalRect.right > 0 &&
                     finalRect.top < window.innerHeight && finalRect.left < window.innerWidth,
          position: finalRect
        });

        if (!isVisible) {
          console.error('Popover should be visible but computed styles indicate otherwise!');
        }
      }, 300); // Wait for transition to complete
    });
  }

  updatePopoverContent(wordText, pronunciation, translation, definition, context = null) {
    this.popover.querySelector('.word-text').textContent = wordText;
    this.popover.querySelector('.word-pronunciation').textContent = pronunciation;
    this.popover.querySelector('.word-translation').textContent = translation;

    // Show definition if available
    const definitionEl = this.popover.querySelector('.word-definition');
    if (definition && definitionEl) {
      definitionEl.innerHTML = `
        <div style="margin-top: var(--space-3); padding-top: var(--space-3); border-top: 1px solid var(--separator-color);">
          <div style="font-size: var(--fs-caption-2); color: var(--text-quaternary); text-transform: uppercase; letter-spacing: 0.02em; margin-bottom: var(--space-2);">
            ${definition.partOfSpeech}
          </div>
          <div style="font-size: var(--fs-subhead); color: var(--text-secondary); line-height: var(--line-height-normal);">
            ${definition.definition}
          </div>
          ${definition.example ? `
            <div style="margin-top: var(--space-2); font-style: italic; color: var(--text-tertiary);">
              "${definition.example}"
            </div>
          ` : ''}
        </div>
      `;
      definitionEl.style.display = 'block';
    } else if (definitionEl) {
      definitionEl.style.display = 'none';
    }

    // Show context if available (simplified)
    if (context && context.sentence) {
      const contextEl = this.popover.querySelector('.word-context');
      if (contextEl) {
        contextEl.querySelector('.context-source').textContent = context.sentence;
        contextEl.querySelector('.context-translation').textContent = 'Context translation not available';
        contextEl.style.display = 'block';
      }
    } else {
      const contextEl = this.popover.querySelector('.word-context');
      if (contextEl) {
        contextEl.style.display = 'none';
      }
    }
  }

  async updateContextContent(context, contextTranslation = null) {

    if (!this.popover) {
      console.warn('Popover not initialized, cannot update context');
      return;
    }

    const contextEl = this.popover.querySelector('.word-context');
    if (!contextEl) {
      console.error('Context element .word-context not found in popover');
      return;
    }

    const sourceEl = contextEl.querySelector('.context-source');
    const translationEl = contextEl.querySelector('.context-translation');

    if (!sourceEl || !translationEl) {
      console.error('Context sub-elements not found');
      contextEl.style.display = 'none';
      return;
    }

    // Capture current ID at start of operation
    const requestId = this.currentRequestId;

    if (!context || !context.sentence) {
      contextEl.style.display = 'none';
      return;
    }

    try {
      const highlightedSentence = ContextExtractor.highlightWordInSentence(
        context.sentence,
        context.word
      );
      sourceEl.innerHTML = `<em>${highlightedSentence}</em>`;

      if (contextTranslation) {
        translationEl.textContent = contextTranslation;
        translationEl.style.display = 'block';
        contextEl.style.display = 'block';
      } else {
        translationEl.textContent = 'Перевод контекста загружается...';
        translationEl.style.display = 'block';
        contextEl.style.display = 'block';

        // 🔥 MAIN FIX: Call contextTranslationService
        try {
          const translation = await contextTranslationService.translateSentence(context.sentence);
          
          // 🛑 Race Condition Check
          if (this.currentRequestId !== requestId) {
             console.log('Ignoring stale context translation');
             return;
          }
          
          translationEl.textContent = translation || 'Translation unavailable';
        } catch (error) {
          if (this.currentRequestId !== requestId) return;
          console.error('Context translation error:', error);
          translationEl.textContent = 'Translation failed';
        }
      }
    } catch (error) {
      console.error('Error updating context content:', error);
      contextEl.style.display = 'none';
    }
  }

  showErrorPopover(wordText, rect) {
    console.log('Showing error popover for:', wordText);

    // Show basic fallback content
    this.popover.querySelector('.word-pronunciation').textContent = `/${wordText}/`;

    const cached = this._getCachedWordData(wordText);
    if (cached?.translation) {
      this.popover.querySelector('.word-translation').textContent = cached.translation;
    } else {
      this.popover.querySelector('.word-translation').textContent = 'Перевод временно недоступен';
    }

    // Hide definition
    const definitionEl = this.popover.querySelector('.word-definition');
    if (definitionEl) definitionEl.style.display = 'none';

    console.log('Error popover content set');
  }

  hide() {
    this.popover.classList.remove('visible');
    setTimeout(() => {
      this.popover.style.display = 'none';
    }, 200); // Match CSS transition
    this.activeWord = null;
  }

  /**
   * Clean up resources and event listeners
   */
  destroy() {
    // Cancel any pending requests in services
    if (this.wordService) {
      this.wordService.cancelRequests();
    }

    // Remove global event listeners
    if (this.boundHandlers.clickOutside) {
      document.removeEventListener('click', this.boundHandlers.clickOutside);
    }
    if (this.boundHandlers.escapeKey) {
      document.removeEventListener('keydown', this.boundHandlers.escapeKey);
    }

    // Remove popover from DOM
    if (this.popover && this.popover.parentNode) {
      this.popover.remove();
    }

    // Clear references
    this.boundHandlers = {};
    this.popover = null;
    this.activeWord = null;
    this.container = null;
    this.wordService = null;
    this.ttsService = null;
  }

  positionPopover(rect) {
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 10;
    const arrowSize = 8;

    // Get popover dimensions without forcing layout (use cached or estimated values)
    // This avoids the "Forced Reflow" performance issue
    const popoverRect = this.popover.getBoundingClientRect();

    // For initial positioning, use estimated width/height if not yet measured
    // This prevents the layout thrashing mentioned in the audit
    let popoverWidth = popoverRect.width || 300; // Estimated width
    let popoverHeight = popoverRect.height || 200; // Estimated height

    // Center horizontally relative to word
    const wordCenterX = rect.left + (rect.width / 2);
    let left = wordCenterX - (popoverWidth / 2);

    // Horizontal bounds check
    if (left < margin) {
      left = margin;
    } else if (left + popoverWidth > viewportWidth - margin) {
      left = viewportWidth - popoverWidth - margin;
    }

    // Vertical positioning - prefer above
    let top = rect.top - popoverHeight - arrowSize - 4;
    let isBelow = false;

    if (top < margin) {
      top = rect.bottom + arrowSize + 4;
      isBelow = true;

      // Fallback if no space below either
      if (top + popoverHeight > viewportHeight - margin) {
        top = Math.max(margin, (viewportHeight - popoverHeight) / 2);
      }
    }

    // Apply positioning using transform for better performance (GPU acceleration)
    requestAnimationFrame(() => {
      this.popover.style.position = 'fixed';
      this.popover.style.left = `${left}px`;
      this.popover.style.top = `${top}px`;
      this.popover.style.transform = 'translateY(10px) scale(0.95)'; // Start slightly offset for animation

      // Arrow positioning
      const arrowElement = this.popover.querySelector('.word-popover-arrow');
      if (arrowElement) {
        let arrowLeft = wordCenterX - left;
        arrowLeft = Math.max(16, Math.min(arrowLeft, popoverWidth - 16));
        arrowElement.style.left = `${arrowLeft}px`;

        if (isBelow) {
          this.popover.classList.add('below');
        } else {
          this.popover.classList.remove('below');
        }
      }
    });

    console.log(`✅ Popover positioned: ${Math.round(left)}x${Math.round(top)} (${isBelow ? 'below' : 'above'})`);
  }

  async playAudio() {
    // 🔊 AUDIO REFACTOR:
    // Manual playback (clicking the button) should ALWAYS work, ignoring the setting.
    // The 'autoPlayAudio' setting is now only used in show() for automatic playback.
    
    const wordText = this.popover.querySelector('.word-text').textContent;

    try {
      const success = await this.ttsService.playPronunciation(wordText);
      if (!success) {
        // Show error toast if TTS failed
        this.showToast('Failed to play pronunciation', 'error');
      }
    } catch (error) {
      console.error('TTS error:', error);
      this.showToast('Failed to play pronunciation', 'error');
    }
  }

  async addToVocabulary() {
    const wordText = this.popover.querySelector('.word-text').textContent;

    // Pull latest translation/pronunciation from DOM, but fall back to cached API data
    let translation = this.popover.querySelector('.word-translation').textContent;
    let pronunciation = this.popover.querySelector('.word-pronunciation').textContent;

    const cached = this._getCachedWordData(wordText);

    if ((!translation || translation.includes('Загрузка') || translation.includes('недоступен')) && cached?.translation) {
      translation = cached.translation;
    }

    if ((!pronunciation || pronunciation.includes('Загрузка')) && cached?.pronunciation) {
      pronunciation = cached.pronunciation;
    }

    try {
      // Используем this.vocabularyStorage вместо window.readerView
      if (!this.vocabularyStorage) {
        throw new Error('Vocabulary storage not available');
      }

      console.log('Adding word to vocabulary:', { wordText, translation, pronunciation });

      await this.vocabularyStorage.addWord({
        word: wordText,
        translation: translation,
        phonetic: pronunciation, // Используем уже загруженное произношение из DOM
        addedAt: Date.now(),
        difficulty: 3
      });

      // Success feedback
      import('../managers/ToastManager.js').then(({ toastManager }) => {
        toastManager.success(`"${wordText}" added to vocabulary!`);
      }).catch(() => {
        console.log('Toast manager not available, word added successfully');
      });

      this.hide();
    } catch (error) {
      console.error('Error adding to vocabulary:', error);
      import('../managers/ToastManager.js').then(({ toastManager }) => {
        toastManager.error('Failed to add word to vocabulary');
      }).catch(() => {
        console.error('Failed to add word and show error notification');
      });
    }
  }

  viewInFlashcards() {
    const wordText = this.popover.querySelector('.word-text').textContent;

    // Navigate to flashcards with word filter
    window.location.hash = `#/flashcards?word=${wordText}`;
    this.hide();
  }
}
