/**
 * @fileoverview Simplified Flashcards View
 * Simple 3-button interface for learning vocabulary
 * No SM-2, just basic Don't Know/Know/Mastered ratings
 */

import { simpleVocabularyStorage, WORD_STATUS } from '../vocabulary/vocabulary-storage.simple.js';

export class FlashcardsViewSimplified {
  constructor(container) {
    this.container = container;
    this.currentCardIndex = 0;
    this.cards = [];
    this.isFlipped = false;
    this.sessionStats = {
      reviewed: 0,
      dontKnow: 0,
      know: 0,
      mastered: 0
    };

    this._keydownAttached = false;

    // Bind methods
    this.handleFlip = this.handleFlip.bind(this);
    this.handleRating = this.handleRating.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleSpeak = this.handleSpeak.bind(this);
    this.nextCard = this.nextCard.bind(this);
  }

  /**
   * Helper to escape HTML special characters
   */
  escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * Render the flashcards interface
   */
  async render() {
    try {
      // Load only LEARNING words (words currently being practiced)
      this.cards = simpleVocabularyStorage.getWordsByStatus(WORD_STATUS.LEARNING);

      if (this.cards.length === 0) {
        this.renderEmptyState();
        return;
      }

      // Shuffle cards for variety
      this.shuffleCards();

      this.currentCardIndex = 0;
      this.isFlipped = false;
      this.sessionStats = { reviewed: 0, dontKnow: 0, know: 0, mastered: 0 };

      // Attach keyboard once per view lifecycle
      if (!this._keydownAttached) {
        document.addEventListener('keydown', this.handleKeyDown);
        this._keydownAttached = true;
      }

      this.renderCard();
    } catch (error) {
      console.error('Failed to render flashcards:', error);
      this.renderErrorState(error);
    }
  }

  /**
   * Render empty state when no learning words
   */
  renderEmptyState() {
    const totalWords = simpleVocabularyStorage.getAllWords().length;
    const knownWords = simpleVocabularyStorage.getWordsByStatus(WORD_STATUS.KNOWN).length;

    this.container.innerHTML = `
      <div class="flashcards-simplified">
        <div class="empty-state">
          <div class="empty-icon">🎴</div>
          <h2>No words to practice</h2>
          <p>You have ${totalWords} words in your vocabulary, ${knownWords} mastered.</p>

          ${totalWords === 0 ?
            `<p>Start by adding some words from the reader!</p>
             <a href="#/reader" class="btn-primary">Go to Reader</a>` :
            `<p>Move some words from "TO KNOW" to "LEARNING" in the Vocabulary section.</p>
             <a href="#/vocabulary" class="btn-primary">Go to Vocabulary</a>`
          }
        </div>
      </div>
    `;
  }

  /**
   * Render error state
   */
  renderErrorState(error) {
    this.container.innerHTML = `
      <div class="flashcards-simplified">
        <div class="error-state">
          <div class="error-icon">❌</div>
          <h2>Failed to load flashcards</h2>
          <p>${error.message}</p>
          <button onclick="location.reload()" class="btn-secondary">Retry</button>
        </div>
      </div>
    `;
  }

  /**
   * Render current flashcard
   */
  renderCard() {
    if (this.currentCardIndex >= this.cards.length) {
      this.renderSessionComplete();
      return;
    }

    const card = this.cards[this.currentCardIndex];

    // Data validation
    if (!card || !card.word) {
      console.error('❌ Invalid card data:', card);
      this.nextCard();
      return;
    }

    const progress = ((this.currentCardIndex + 1) / this.cards.length * 100).toFixed(1);
    const wordSafe = this.escapeHtml(card.word);
    const translationSafe = this.escapeHtml(card.translation);
    const phoneticSafe = this.escapeHtml(card.phonetic);

    this.container.innerHTML = `
      <div class="flashcards-simplified">
        <div class="flashcard-header">
          <div class="progress-info">
            Card ${this.currentCardIndex + 1} of ${this.cards.length} (${progress}%)
          </div>
          <div class="session-stats">
            Reviewed: ${this.sessionStats.reviewed}
          </div>
        </div>

        <div class="flashcard-container">
          <div class="flashcard ${this.isFlipped ? 'flipped' : ''}">
            <div class="flashcard-inner">
              <div class="flashcard-front">
                <div class="card-content">
                  <div class="word-text">${wordSafe}</div>
                  ${phoneticSafe ? `<div class="word-phonetic">${phoneticSafe}</div>` : ''}
                  <button class="btn-tts" type="button" aria-label="Speak word">🔊</button>
                  <div class="flip-hint">Click to reveal translation</div>
                </div>
              </div>
              <div class="flashcard-back">
                <div class="card-content">
                  <div class="word-text">${wordSafe}</div>
                  ${phoneticSafe ? `<div class="word-phonetic">${phoneticSafe}</div>` : ''}
                  <button class="btn-tts" type="button" aria-label="Speak word">🔊</button>
                  <div class="word-translation">${translationSafe}</div>
                  <div class="rating-prompt">How well did you know this?</div>
                </div>
              </div>
            </div>
          </div>

          <div class="rating-buttons ${this.isFlipped ? 'visible' : ''}">
            <button class="btn-rating btn-dont-know" type="button" data-rating="dont_know">
              Don't Know
            </button>
            <button class="btn-rating btn-know" type="button" data-rating="know">
              Know
            </button>
            <button class="btn-rating btn-mastered" type="button" data-rating="mastered">
              Mastered ✓
            </button>
          </div>
        </div>

        <div class="flashcard-footer">
          <button class="btn-secondary js-back-vocabulary" type="button">
            Back to Vocabulary
          </button>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  /**
   * Render session complete screen
   */
  renderSessionComplete() {
    const totalReviewed = this.sessionStats.reviewed;
    const accuracy = totalReviewed > 0 ?
      Math.round((this.sessionStats.know + this.sessionStats.mastered) / totalReviewed * 100) : 0;

    this.container.innerHTML = `
      <div class="flashcards-simplified">
        <div class="session-complete">
          <div class="complete-icon">🎉</div>
          <h2>Practice Session Complete!</h2>

          <div class="session-results">
            <div class="result-item">
              <span class="result-label">Cards reviewed:</span>
              <span class="result-value">${totalReviewed}</span>
            </div>
            <div class="result-item">
              <span class="result-label">Don't know:</span>
              <span class="result-value">${this.sessionStats.dontKnow}</span>
            </div>
            <div class="result-item">
              <span class="result-label">Know:</span>
              <span class="result-value">${this.sessionStats.know}</span>
            </div>
            <div class="result-item">
              <span class="result-label">Mastered:</span>
              <span class="result-value">${this.sessionStats.mastered}</span>
            </div>
            <div class="result-item">
              <span class="result-label">Accuracy:</span>
              <span class="result-value">${accuracy}%</span>
            </div>
          </div>

          <div class="session-actions">
            <button class="btn-primary js-practice-again" type="button">
              Practice Again
            </button>
            <button class="btn-secondary js-back-vocabulary" type="button">
              Back to Vocabulary
            </button>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const flashcard = this.container.querySelector('.flashcard');
    if (flashcard) {
      flashcard.addEventListener('click', this.handleFlip);
    }

    this.container.querySelectorAll('.btn-tts').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleSpeak();
      });
    });

    const ratingButtons = this.container.querySelectorAll('.btn-rating');
    ratingButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const rating = e.target.dataset.rating;
        this.handleRating(rating);
      });
    });

    const backButtons = this.container.querySelectorAll('.js-back-vocabulary');
    backButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        window.location.hash = '#/vocabulary';
      });
    });

    const practiceAgain = this.container.querySelector('.js-practice-again');
    if (practiceAgain) {
      practiceAgain.addEventListener('click', () => {
        this.render();
      });
    }
  }

  /**
   * Handle card flip
   */
  handleFlip(e) {
    if (e && e.target && e.target.closest && e.target.closest('button')) return;

    if (!this.isFlipped) {
      this.isFlipped = true;

      const flashcard = this.container.querySelector('.flashcard');
      const ratingButtons = this.container.querySelector('.rating-buttons');

      if (flashcard) {
        flashcard.classList.add('flipped');
      }

      if (ratingButtons) {
        ratingButtons.offsetHeight; // Force reflow
        ratingButtons.classList.add('visible');
      }
    }
  }

  handleSpeak() {
    const card = this.cards[this.currentCardIndex];
    if (!card) return;

    if (typeof window === 'undefined' || !window.speechSynthesis) {
      this.showToast('TTS is not supported', 'error');
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(card.word);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('TTS error:', error);
    }
  }

  /**
   * Handle rating selection
   */
  handleRating(rating) {
    const card = this.cards[this.currentCardIndex];
    if (!card) return;

    try {
      this.sessionStats.reviewed++;

      switch (rating) {
        case 'dont_know':
          this.sessionStats.dontKnow++;
          simpleVocabularyStorage.updateStatus(card.id, WORD_STATUS.LEARNING);
          break;
        case 'know':
          this.sessionStats.know++;
          card.reviewCount = (card.reviewCount || 0) + 1;
          if (card.reviewCount >= 5) {
            simpleVocabularyStorage.updateStatus(card.id, WORD_STATUS.KNOWN);
          } else {
            simpleVocabularyStorage.updateStatus(card.id, WORD_STATUS.LEARNING);
          }
          break;
        case 'mastered':
          this.sessionStats.mastered++;
          simpleVocabularyStorage.updateStatus(card.id, WORD_STATUS.KNOWN);
          break;
      }

      this.nextCard();
    } catch (error) {
      console.error('Error handling rating:', error);
      this.showToast('Error saving rating', 'error');
    }
  }

  /**
   * Move to next card
   */
  nextCard() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    this.currentCardIndex++;
    this.isFlipped = false;

    if (this.currentCardIndex >= this.cards.length) {
      this.renderSessionComplete();
    } else {
      this.renderCard();
    }
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyDown(e) {
    if (!this.isFlipped && (e.key === ' ' || e.key === 'Enter')) {
      e.preventDefault();
      this.handleFlip();
      return;
    }

    if (!this.isFlipped) return;

    switch (e.key) {
      case '1': case 'd': case 'D':
        e.preventDefault();
        this.handleRating('dont_know');
        break;
      case '2': case 'k': case 'K':
        e.preventDefault();
        this.handleRating('know');
        break;
      case '3': case 'm': case 'M':
        e.preventDefault();
        this.handleRating('mastered');
        break;
      case 's': case 'S':
        e.preventDefault();
        this.handleSpeak();
        break;
    }
  }

  /**
   * Shuffle cards array
   */
  shuffleCards() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    if (window.toastManager) {
      window.toastManager[type](message);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  /**
   * Clean up event listeners
   */
  destroy() {
    if (this._keydownAttached) {
      document.removeEventListener('keydown', this.handleKeyDown);
      this._keydownAttached = false;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.container.innerHTML = '';
  }
}
