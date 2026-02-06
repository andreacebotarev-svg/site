/**
 * @fileoverview Vocabulary Kanban Board View
 * Shows all vocabulary words organized by learning status
 * Uses EnhancedVocabularyStorage and GlobalState for reactivity
 * @module VocabularyView
 */

import { vocabularyStorage } from '../vocabulary/vocabulary-storage.enhanced.js';
import { globalState } from '../core/state-manager.js';

// Local constants for mapping SM-2 to Kanban
const VIEW_STATUS = {
  TO_KNOW: 'to_know',      // Not started (repetitions === 0)
  LEARNING: 'learning',    // In progress (0 < repetitions < 5)
  KNOWN: 'known'          // Mastered (repetitions >= 5)
};

/**
 * Vocabulary Kanban Board View
 * Displays words in three columns with Drag & Drop support
 * @class VocabularyView
 */
export class VocabularyView {
  constructor(container) {
    this.container = container;
    this.logger = console;
    
    // State subscription
    this.unsubscribe = null;

    // Bind methods
    this.handleStartLearning = this.handleStartLearning.bind(this);
    this.handlePractice = this.handlePractice.bind(this);
    this.handleMoveToToKnow = this.handleMoveToToKnow.bind(this);
    this.handleDeleteWord = this.handleDeleteWord.bind(this);
    this.handleWordClick = this.handleWordClick.bind(this);
  }

  /**
   * Helper to map word to status
   */
  getWordStatus(word) {
    if (word.repetitions >= 5) return VIEW_STATUS.KNOWN;
    if (word.repetitions > 0) return VIEW_STATUS.LEARNING;
    return VIEW_STATUS.TO_KNOW;
  }

  /**
   * Initialize and render
   */
  async render() {
    this.logger.log('Rendering Vocabulary Kanban Board');

    // Attach PERMANENT event delegation on first render
    if (!this._eventsAttached) {
      this.attachEventListeners();
      this._eventsAttached = true;
    }

    // Subscribe to state if not already subscribed
    if (!this.unsubscribe) {
      this.unsubscribe = globalState.subscribe((state) => {
        if (this.container && this._eventsAttached) {
          this.renderContent(state.vocabulary.words || []);
        }
      }, ['vocabulary']);
    }

    // Initial data load and render
    const currentWords = vocabularyStorage.getAllWords();
    this.renderContent(currentWords);
  }

  /**
   * Render content based on words list
   */
  renderContent(allWords) {
    try {
      // Group words by status
      const toKnow = allWords.filter(w => this.getWordStatus(w) === VIEW_STATUS.TO_KNOW);
      const learning = allWords.filter(w => this.getWordStatus(w) === VIEW_STATUS.LEARNING);
      const known = allWords.filter(w => this.getWordStatus(w) === VIEW_STATUS.KNOWN);

      // Calculate statistics
      const totalWords = allWords.length;
      const completionRate = totalWords > 0 ? Math.round((known.length / totalWords) * 100) : 0;

      // Render HTML (only the dynamic parts, listeners stay on container)
      this.container.innerHTML = `
        <div class="vocabulary-view">
          <div class="vocabulary-header">
            <h1>📚 My Vocabulary</h1>
            <div class="vocabulary-stats">
              <span class="stat-total">${totalWords} words</span>
              <span class="stat-completion">${completionRate}% mastered</span>
            </div>
          </div>

          <div class="vocabulary-kanban">
            ${this.renderColumn(VIEW_STATUS.TO_KNOW, 'TO KNOW', 'New words to learn', toKnow, 'start')}
            ${this.renderColumn(VIEW_STATUS.LEARNING, 'LEARNING', 'Words in progress', learning, 'practice')}
            ${this.renderColumn(VIEW_STATUS.KNOWN, 'KNOWN', 'Mastered words', known, 'known')}
          </div>

          <div class="vocabulary-actions">
            <button class="btn-primary js-start-flashcards" type="button">
              🎴 Start Flashcards Practice
            </button>
            <button class="btn-secondary js-add-word" type="button">
              ➕ Add New Word
            </button>
          </div>
        </div>
      `;

    } catch (error) {
      this.logger.error('Failed to render vocabulary view:', error);
      this.container.innerHTML = `
        <div class="error-message">
          <h2>❌ Error loading vocabulary</h2>
          <p>${error.message}</p>
          <button onclick="location.reload()">Reload</button>
        </div>
      `;
    }
  }

  /**
   * Render a single kanban column
   */
  renderColumn(status, title, subtitle, words, action) {
    const wordCards = words.map(word => this.renderWordCard(word, action)).join('');

    return `
      <div class="kanban-column kanban-${status}" data-status="${status}">
        <div class="kanban-column-header">
          <h2>${title}</h2>
          <span class="column-count">(${words.length})</span>
          <p class="column-subtitle">${subtitle}</p>
        </div>
        <div class="kanban-column-content">
          ${wordCards}
          ${words.length === 0 ? '<div class="empty-column">No words yet</div>' : ''}
        </div>
        ${action === 'practice' ? `
          <div class="column-actions">
            <button class="btn-practice-all" type="button" onclick="window.location.hash='#/flashcards?filter=learning'">
              Practice All (${words.length})
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Render a single word card
   */
  renderWordCard(word, action) {
    const phonetic = word.phonetic ? `<div class="word-phonetic">${word.phonetic}</div>` : '';
    const reviewCount = (word.repetitions || 0) > 0 ? `<div class="word-review-count">Reviews: ${word.repetitions}</div>` : '';

    let actionButton = '';
    switch (action) {
      case 'start':
        actionButton = `<button class="btn-start-learning" type="button" data-word-id="${word.id}">Start Learning</button>`;
        break;
      case 'practice':
        actionButton = `<button class="btn-practice" type="button" data-word-id="${word.id}">Practice</button>`;
        break;
      case 'known':
        actionButton = `<button class="btn-move-back" type="button" data-word-id="${word.id}">Move to TO KNOW</button>`;
        break;
    }

    return `
      <div class="word-card" data-word-id="${word.id}" draggable="true">
        <button class="btn-delete-word" type="button" data-word-id="${word.id}" aria-label="Delete word" title="Delete word">✕</button>
        <div class="word-text">${word.word}</div>
        ${phonetic}
        <div class="word-translation">${word.translation}</div>
        ${reviewCount}
        <div class="word-actions">
          ${actionButton}
        </div>
      </div>
    `;
  }

  /**
   * Attach PERMANENT event listeners using delegation
   */
  attachEventListeners() {
    if (!this.container) return;

    // Handle all clicks via delegation on container
    this.container.addEventListener('click', (e) => {
      const target = e.target;
      
      // 1. Action Buttons
      if (target.closest('.js-start-flashcards')) {
        window.location.hash = '#/flashcards';
        return;
      }
      if (target.closest('.js-add-word')) {
        this.showAddWordDialog();
        return;
      }

      // 2. Card Specific Actions (Delete, Move, etc)
      const actionBtn = target.closest('button[data-word-id]');
      if (actionBtn) {
        const wordId = actionBtn.dataset.wordId;
        e.stopPropagation();

        if (actionBtn.classList.contains('btn-delete-word')) {
          this.handleDeleteWord(wordId);
        } else if (actionBtn.classList.contains('btn-start-learning')) {
          this.handleStartLearning(wordId);
        } else if (actionBtn.classList.contains('btn-move-back')) {
          this.handleMoveToToKnow(wordId);
        } else if (actionBtn.classList.contains('btn-practice')) {
          this.handlePractice(wordId);
        }
        return;
      }

      // 3. Card click (details)
      const card = target.closest('.word-card');
      if (card && !target.closest('button')) {
        this.handleWordClick(card.dataset.wordId);
      }
    });

    // 4. Drag and Drop delegation
    // Use the container to listen for events bubbles from cards and columns
    this.container.addEventListener('dragstart', (e) => {
      const card = e.target.closest('.word-card');
      if (!card) return;
      
      const wordId = card.dataset.wordId;
      e.dataTransfer.setData('text/plain', wordId);
      e.dataTransfer.effectAllowed = 'move';
      card.classList.add('is-dragging');
    });

    this.container.addEventListener('dragend', (e) => {
      const card = e.target.closest('.word-card');
      if (card) card.classList.remove('is-dragging');
    });

    this.container.addEventListener('dragover', (e) => {
      const column = e.target.closest('.kanban-column');
      if (!column) return;
      
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      column.classList.add('is-drag-over');
    });

    this.container.addEventListener('dragleave', (e) => {
      const column = e.target.closest('.kanban-column');
      if (column) column.classList.remove('is-drag-over');
    });

    this.container.addEventListener('drop', (e) => {
      const column = e.target.closest('.kanban-column');
      if (!column) return;
      
      e.preventDefault();
      column.classList.remove('is-drag-over');

      const wordId = e.dataTransfer.getData('text/plain');
      const newStatus = column.dataset.status;

      if (wordId && newStatus) {
        this.handleStatusUpdate(wordId, newStatus);
      }
    });
  }

  /**
   * Unified status update handler
   */
  handleStatusUpdate(wordId, newStatus) {
    let updates = {};
    if (newStatus === VIEW_STATUS.TO_KNOW) {
      updates = { repetitions: 0, interval: 0, easeFactor: 2.5 };
    } else if (newStatus === VIEW_STATUS.LEARNING) {
      const word = vocabularyStorage.getWord(wordId);
      if (word && (word.repetitions === 0 || word.repetitions >= 5)) {
        updates = { repetitions: 1, interval: 1, nextReview: Date.now() };
      }
    } else if (newStatus === VIEW_STATUS.KNOWN) {
      updates = { repetitions: 5, interval: 30 };
    }

    if (Object.keys(updates).length > 0) {
      try {
        const success = vocabularyStorage.updateWord(wordId, updates);
        if (success) {
          this.showToast('Word updated!', 'success');
        }
      } catch (err) {
        this.showToast('Update failed!', 'error');
      }
    }
  }

  handleDeleteWord(wordId) {
    const word = vocabularyStorage.getWord(wordId);
    if (!word) return;

    this.showConfirmDialog(
      `Delete "${word.word}"?`,
      `Are you sure you want to delete "${word.word}"?`,
      () => {
        vocabularyStorage.removeWord(wordId);
        this.showToast('Word deleted', 'success');
      }
    );
  }

  handleStartLearning(wordId) {
    // Set repetitions to 1 to move to "Learning" column
    vocabularyStorage.updateWord(wordId, { repetitions: 1, interval: 1 });
    this.showToast('Word moved to LEARNING', 'success');
  }

  handleMoveToToKnow(wordId) {
    // Reset to new
    vocabularyStorage.updateWord(wordId, { repetitions: 0, interval: 0, easeFactor: 2.5 });
    this.showToast('Word moved to TO KNOW', 'success');
  }
  
  // Reuse existing methods for UI interactions (Dialogs, Toasts) - kept mostly same
  
  handlePractice(wordId) {
    window.location.hash = `#/flashcards?word=${wordId}`;
  }

  handleWordClick(wordId) {
    const word = vocabularyStorage.getWord(wordId);
    if (word) this.showWordDetails(word);
  }

  showConfirmDialog(title, message, onConfirm) {
    if (confirm(`${title}\n${message}`)) {
      onConfirm();
    }
  }

  showWordDetails(word) {
    const status = this.getWordStatus(word).toUpperCase().replace('_', ' ');
    const html = `
      <div class="word-details-modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>${word.word}</h3>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <p><strong>Translation:</strong> ${word.translation}</p>
            <p><strong>Status:</strong> ${status}</p>
            <p><strong>Repetitions:</strong> ${word.repetitions}</p>
            <p><strong>EF:</strong> ${word.easeFactor?.toFixed(2)}</p>
          </div>
        </div>
      </div>
    `;
    
    // Using simple approach (creating element)
    const el = document.createElement('div');
    el.innerHTML = html;
    const modal = el.firstElementChild;
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
        if (e.target.matches('.modal-close') || e.target === modal) {
            modal.remove();
        }
    });
  }

  showToast(message, type = 'info') {
    // console.log(`[${type}] ${message}`);
    // Use existing toast if available
    if (window.toastManager) window.toastManager[type](message);
  }

  showAddWordDialog() {
    this.showToast('Use the Reader to add words!', 'info');
  }

  /**
   * Destroy and cleanup
   */
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.container.innerHTML = '';
  }
}
